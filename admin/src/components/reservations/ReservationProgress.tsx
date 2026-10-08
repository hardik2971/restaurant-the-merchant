import { Check, X } from 'lucide-react';
import {
  STATUS_LABELS,
  type ReservationKind,
  type ReservationStatus,
} from '@/lib/reservations-data';
import { cn } from '@/lib/utils';

// Step-wise progress for a reservation, mirroring the Orders progress bar.
// Table bookings get a "Checked In" step; private events skip it.
const FLOWS: Record<ReservationKind, ReservationStatus[]> = {
  TABLE: ['REQUESTED', 'CONFIRMED', 'SEATED', 'COMPLETED'],
  PRIVATE_EVENT: ['REQUESTED', 'CONFIRMED', 'COMPLETED'],
};

export function ReservationProgress({
  kind,
  status,
}: {
  kind: ReservationKind;
  status: ReservationStatus;
}) {
  const flow = FLOWS[kind];
  const off = status === 'CANCELED' || status === 'NO_SHOW';
  const currentIndex = off ? -1 : flow.indexOf(status);

  return (
    <div className="rounded-xl border border-border px-4 py-4">
      <ol className="flex items-start">
        {flow.map((s, i) => {
          const done = !off && i < currentIndex;
          const current = !off && i === currentIndex;
          const reached = done || current;
          return (
            <li key={s} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold transition-colors',
                    current
                      ? 'border-accent bg-accent text-white ring-4 ring-accent-soft'
                      : done
                        ? 'border-accent bg-accent text-white'
                        : 'border-border bg-surface text-fg-muted',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-center text-[11px] font-medium leading-tight',
                    reached ? 'text-fg' : 'text-fg-muted',
                  )}
                >
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {i < flow.length - 1 && (
                <span
                  className={cn(
                    'mx-1 mt-4 h-0.5 flex-1 rounded transition-colors',
                    i < currentIndex ? 'bg-accent' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {off && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          <X className="h-4 w-4" /> This reservation was {STATUS_LABELS[status].toLowerCase()}.
        </div>
      )}
    </div>
  );
}
