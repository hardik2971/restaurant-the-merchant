import { STATUS_LABELS, type OrderStatus } from '@/lib/orders-data';
import { cn } from '@/lib/utils';

const STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-bg text-fg-muted',
  PREPARING: 'bg-warn-soft text-warn',
  READY: 'bg-info-soft text-info',
  COMPLETED: 'bg-success-soft text-success',
  CANCELED: 'bg-danger-soft text-danger',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
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
