import { requirePermission } from '@/lib/guard';
import { getAuditLogs } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const ACTION_CLS: Record<string, string> = {
  open: 'bg-success-soft text-success',
  close: 'bg-accent-soft text-accent',
  add: 'bg-info-soft text-info',
  void: 'bg-danger-soft text-danger',
  merge: 'bg-warn-soft text-warn',
  state: 'bg-bg text-fg-muted',
  payment: 'bg-info-soft text-info',
};

function cls(action: string) {
  const key = action.split('.')[1] ?? action.split('.')[0];
  return ACTION_CLS[key] ?? 'bg-bg text-fg-muted';
}

export default async function AuditPage() {
  await requirePermission('manage:settings');
  const logs = await getAuditLogs(200);

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
            <th className="px-5 py-3 font-medium">When</th>
            <th className="px-5 py-3 font-medium">Action</th>
            <th className="px-5 py-3 font-medium">Entity</th>
            <th className="px-5 py-3 font-medium">Detail</th>
            <th className="px-5 py-3 font-medium">By</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-border last:border-0 hover:bg-bg/60">
              <td className="whitespace-nowrap px-5 py-3 text-fg-muted">{formatDate(l.createdAt, 'MMM d, h:mm a')}</td>
              <td className="px-5 py-3">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${cls(l.action)}`}>{l.action}</span>
              </td>
              <td className="px-5 py-3 text-fg-muted">{l.entity}</td>
              <td className="px-5 py-3 text-fg-muted">{l.detail ?? '—'}</td>
              <td className="px-5 py-3">{l.userName ?? 'System'}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-fg-muted">No activity logged yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
