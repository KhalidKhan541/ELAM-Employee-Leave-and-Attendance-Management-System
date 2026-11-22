/** CR-01: leave longer than this many working days needs HR approval. */
export const MANAGER_APPROVAL_LIMIT_DAYS = 3;

export class ManagerLimitRule {
  requiresHrApproval(workingDays: number): boolean {
    return workingDays > MANAGER_APPROVAL_LIMIT_DAYS;
  }
}

export const managerLimitRule = new ManagerLimitRule();
