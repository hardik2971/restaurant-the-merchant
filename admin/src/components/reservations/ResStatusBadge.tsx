import { STATUS_LABELS, type ReservationStatus } from '@/lib/reservations-data';
import { cn } from '@/lib/utils';

const STYLES: Record<ReservationStatus, string> = {
  REQUESTED: 'bg-warn-soft text-warn',
  CONFIRMED: 'bg-info-soft text-info',
  SEATED: 'bg-accent-soft text-accent',
  COMPLETED: 'bg-success-soft text-success',
  CANCELED: 'bg-danger-soft text-danger',
  NO_SHOW: 'bg-bg text-fg-muted',
};

export function ResStatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold',
        STYLES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
