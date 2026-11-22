const styles: Record<string, string> = {
  PENDING_MANAGER: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  PENDING_HR: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  CHECKED_IN: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  COMPLETE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  INCOMPLETE: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const labels: Record<string, string> = {
  PENDING_MANAGER: 'Awaiting manager',
  PENDING_HR: 'Awaiting HR',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  CHECKED_IN: 'Checked in',
  COMPLETE: 'Complete',
  INCOMPLETE: 'Incomplete',
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>{labels[status] ?? status}</span>;
}
