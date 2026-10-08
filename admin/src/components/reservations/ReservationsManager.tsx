'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Search,
  CalendarClock,
  CheckCircle2,
  Users,
  PartyPopper,
  Utensils,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import { setReservationStatus, updateReservation, type ReservationEdit } from '@/lib/actions';
import { ResStatusBadge } from '@/components/reservations/ResStatusBadge';
import { ReservationDetail } from '@/components/reservations/ReservationDetail';
import {
  KIND_LABELS,
  STATUS_LABELS,
  type Reservation,
  type ReservationKind,
  type ReservationStatus,
} from '@/lib/reservations-data';
import { cn, formatDate } from '@/lib/utils';

const STATUS_FILTERS: (ReservationStatus | 'ALL')[] = [
  'ALL',
  'REQUESTED',
  'CONFIRMED',
  'SEATED',
  'COMPLETED',
  'CANCELED',
  'NO_SHOW',
];
const KIND_FILTERS: (ReservationKind | 'ALL')[] = ['ALL', 'TABLE', 'PRIVATE_EVENT'];
const KIND_ICON: Record<ReservationKind, LucideIcon> = {
  TABLE: Utensils,
  PRIVATE_EVENT: PartyPopper,
};

export function ReservationsManager({ initialReservations }: { initialReservations: Reservation[] }) {
  const [items, setItems] = useState<Reservation[]>(initialReservations);
  const [status, setStatus] = useState<ReservationStatus | 'ALL'>('ALL');
  const [kind, setKind] = useState<ReservationKind | 'ALL'>('ALL');
  const [date, setDate] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Reservation | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (r) =>
        (status === 'ALL' || r.status === status) &&
        (kind === 'ALL' || r.kind === kind) &&
        (date === '' || r.date.slice(0, 10) === date) &&
        (q === '' ||
          r.reference.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)),
    );
  }, [items, status, kind, date, query]);

  const stats = useMemo(() => {
    const requested = items.filter((r) => r.status === 'REQUESTED').length;
    const confirmed = items.filter((r) => r.status === 'CONFIRMED' || r.status === 'SEATED').length;
    const events = items.filter((r) => r.kind === 'PRIVATE_EVENT').length;
    return { total: items.length, requested, confirmed, events };
  }, [items]);

  const [, startTransition] = useTransition();
  const changeStatus = (id: string, next: ReservationStatus) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    setActive((cur) => (cur && cur.id === id ? { ...cur, status: next } : cur));
    startTransition(() => {
      setReservationStatus(id, next).catch(() => {});
    });
  };

  const editReservation = (id: string, patch: ReservationEdit) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...(patch.date ? { date: patch.date } : {}),
              ...(patch.time !== undefined ? { time: patch.time } : {}),
              ...(patch.guests !== undefined ? { guests: patch.guests } : {}),
              ...(patch.occasion !== undefined ? { occasion: patch.occasion } : {}),
              ...(patch.requests !== undefined ? { requests: patch.requests } : {}),
            }
          : r,
      ),
    );
    setActive((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
    startTransition(() => {
      updateReservation(id, patch).catch(() => {});
    });
  };

  const STAT_CARDS = [
    { label: 'Total', value: String(stats.total), icon: CalendarClock },
    { label: 'New Requests', value: String(stats.requested), icon: Users },
    { label: 'Confirmed', value: String(stats.confirmed), icon: CheckCircle2 },
    { label: 'Private Events', value: String(stats.events), icon: PartyPopper },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-fg-muted">{s.label}</p>
              <p className="font-display text-xl font-semibold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
                status === s
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent"
            aria-label="Filter by date"
          />
          {date && (
            <button
              type="button"
              onClick={() => setDate('')}
              className="text-xs font-medium text-fg-muted hover:text-accent"
            >
              Clear date
            </button>
          )}
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ReservationKind | 'ALL')}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent"
          >
            {KIND_FILTERS.map((k) => (
              <option key={k} value={k}>
                {k === 'ALL' ? 'All kinds' : KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ref, name, email…"
              className="w-56 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Reference</th>
              <th className="px-5 py-3 font-medium">Guest</th>
              <th className="px-5 py-3 font-medium">Kind</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Party</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const KindIcon = KIND_ICON[r.kind];
              return (
                <tr
                  key={r.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-bg/60"
                  onClick={() => setActive(r)}
                >
                  <td className="px-5 py-3 font-medium">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-accent-soft text-accent"
                        title={KIND_LABELS[r.kind]}
                      >
                        <KindIcon className="h-4 w-4" />
                      </span>
                      {r.reference}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p>{r.name}</p>
                    <p className="text-xs text-fg-muted">{r.email}</p>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">{KIND_LABELS[r.kind]}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-fg-muted" />
                      {formatDate(r.date, 'MMM d')}
                      {r.time ? <span className="text-fg-muted">· {r.time}</span> : null}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {r.kind === 'TABLE' ? `${r.guests} guests` : r.guestRange}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <ResStatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <span className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted">
                        <Eye className="h-4 w-4" />
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-fg-muted">
                  No reservations match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-fg-muted">
        Showing {filtered.length} of {items.length} reservations. Once MySQL is live, bookings
        submitted on the public site land here automatically.
      </p>

      <ReservationDetail
        reservation={active}
        onClose={() => setActive(null)}
        onStatusChange={changeStatus}
        onEdit={editReservation}
      />
    </div>
  );
}
