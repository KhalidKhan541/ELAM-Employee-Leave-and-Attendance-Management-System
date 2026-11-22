/**
 * Orchestrates the leave lifecycle: validation strategies, state transitions,
 * atomic balance updates and audit logging. Depends only on ports.
 */
import { AuthorizationError, DomainError, NotFoundError } from '../errors';
import { LeaveBalancePolicy } from './LeaveBalancePolicy';
import { ALLOWED_TRANSITIONS, type BalanceRecord, type LeaveRequestRecord, type SubmitLeaveInput } from './types';
import type { Clock, UnitOfWork } from './ports';
import { SystemClock } from './ports';
import { defaultLeaveRules, type LeaveRule } from './rules/LeaveRule';
import { ManagerLimitRule } from './rules/ManagerLimitRule';

export interface DecisionActor {
  id: string;
  role: string;
  departmentId: string;
}

export class LeaveRequestService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly policy: LeaveBalancePolicy = new LeaveBalancePolicy(),
    private readonly rules: LeaveRule[] = defaultLeaveRules,
    private readonly managerLimit: ManagerLimitRule = new ManagerLimitRule(),
  ) {}

  async submit(input: SubmitLeaveInput): Promise<LeaveRequestRecord> {
    const now = this.clock.now();
    return this.uow.run(async (repos) => {
      const employee = await repos.employees.findById(input.employeeId);
      if (!employee) throw new NotFoundError('Employee');
      const leaveType = await repos.leaveTypes.findById(input.leaveTypeId);
      if (!leaveType) throw new NotFoundError('Leave type');

      const workingDays = this.policy.countWorkingDays(input.startDate, input.endDate);
      const year = input.startDate.getUTCFullYear();
      const balance = await repos.balances.find(input.employeeId, input.leaveTypeId, year);
      const availability = balance ? this.policy.available(balance) : 0;

      const existing = await repos.leaves.list({ employeeId: input.employeeId });
      const overlapping = existing.filter(
        (r) =>
          (r.status === 'APPROVED' || r.status === 'PENDING_MANAGER' || r.status === 'PENDING_HR') &&
          input.startDate <= r.endDate &&
          input.endDate >= r.startDate,
      );

      for (const rule of this.rules) {
        await rule.check({
          employee,
          leaveType,
          input,
          workingDays,
          availability,
          overlapping,
          now,
        });
      }

      const created = await repos.leaves.create({
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
        workingDays,
        status: 'PENDING_MANAGER',
      });
      await repos.audit.append({
        actorId: input.employeeId,
        action: 'LEAVE_SUBMITTED',
        entity: 'LeaveRequest',
        entityId: created.id,
        newValue: JSON.stringify({ status: created.status, workingDays }),
      });
      return created;
    });
  }

  /** CR-01: decision may route long leave to a second (HR) approval step. */
  async decide(
    id: string,
    actor: DecisionActor,
    decision: 'APPROVE' | 'REJECT',
    comment = '',
  ): Promise<LeaveRequestRecord> {
    return this.uow.run(async (repos) => {
      const request = await repos.leaves.findById(id);
      if (!request) throw new NotFoundError('Leave request');
      const owner = await repos.employees.findById(request.employeeId);
      if (!owner) throw new NotFoundError('Employee');

      this.assertAuthority(actor, owner.departmentId, request.status);

      const target = this.resolveTarget(request, actor, decision);
      this.assertTransition(request.status as BalanceStatus, target);

      let balanceAfter: BalanceRecord | undefined;
      if (target === 'APPROVED') {
        const year = request.startDate.getUTCFullYear();
        const current = await repos.balances.find(request.employeeId, request.leaveTypeId, year);
        if (!current) throw new DomainError('LEAVE_BALANCE_MISSING', 'No balance record exists for this leave type');
        const next = this.policy.deduct(current, request.workingDays);
        balanceAfter = await repos.balances.upsert({
          employeeId: current.employeeId,
          leaveTypeId: current.leaveTypeId,
          year: current.year,
          opening: next.opening,
          carriedIn: next.carriedIn,
          accrued: next.accrued,
          used: next.used,
          reserved: next.reserved,
        });
      }

      const updated = await repos.leaves.updateDecision(id, target, actor.id, comment);
      await repos.audit.append({
        actorId: actor.id,
        action: decision === 'APPROVE' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        entity: 'LeaveRequest',
        entityId: id,
        oldValue: JSON.stringify({ status: request.status }),
        newValue: JSON.stringify({ status: target, balanceUsed: balanceAfter?.used }),
      });
      return updated;
    });
  }

  async cancel(id: string, actor: DecisionActor): Promise<LeaveRequestRecord> {
    return this.uow.run(async (repos) => {
      const request = await repos.leaves.findById(id);
      if (!request) throw new NotFoundError('Leave request');
      if (request.employeeId !== actor.id && actor.role !== 'HR') {
        throw new AuthorizationError('Only the owner or HR can cancel this request');
      }
      this.assertTransition(request.status as BalanceStatus, 'CANCELLED');
      const updated = await repos.leaves.updateDecision(id, 'CANCELLED', actor.id, 'Cancelled by owner');
      await repos.audit.append({
        actorId: actor.id,
        action: 'LEAVE_CANCELLED',
        entity: 'LeaveRequest',
        entityId: id,
        oldValue: JSON.stringify({ status: request.status }),
        newValue: JSON.stringify({ status: 'CANCELLED' }),
      });
      return updated;
    });
  }

  async list(filter: { employeeId?: string; departmentId?: string; status?: string } = {}): Promise<LeaveRequestRecord[]> {
    return this.uow.run((repos) => repos.leaves.list(filter));
  }

  private assertAuthority(actor: DecisionActor, ownerDepartmentId: string, status: string): void {
    // CR-01: once a request reaches the HR stage, only HR may decide on it.
    if (status === 'PENDING_HR' && actor.role !== 'HR') {
      throw new AuthorizationError('This request requires HR approval');
    }
    if (actor.role === 'HR') return;
    if (actor.role === 'MANAGER' && actor.departmentId === ownerDepartmentId) return;
    throw new AuthorizationError('You cannot decide on a request outside your department');
  }

  private resolveTarget(
    request: LeaveRequestRecord,
    actor: DecisionActor,
    decision: 'APPROVE' | 'REJECT',
  ): BalanceStatus {
    if (decision === 'REJECT') return 'REJECTED';
    if (request.status === 'PENDING_HR') return 'APPROVED';
    if (this.managerLimit.requiresHrApproval(request.workingDays) && actor.role !== 'HR') {
      return 'PENDING_HR';
    }
    return 'APPROVED';
  }

  private assertTransition(from: BalanceStatus, to: BalanceStatus): void {
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new DomainError('LEAVE_INVALID_TRANSITION', `Cannot move from ${from} to ${to}`);
    }
  }
}

type BalanceStatus = keyof typeof ALLOWED_TRANSITIONS;
