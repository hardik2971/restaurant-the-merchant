'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Users, Clock, Receipt, UserRound } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { openTableSession, closeTableSession, setTableState } from '@/lib/actions';
import {
  STATE_UI,
  TABLE_STATES,
  PAYMENT_METHODS,
  type FloorTable,
  type TableState,
} from '@/lib/floor-data';
import { cn, formatCurrency } from '@/lib/utils';

function fmtDuration(fromIso: string, now: number): string {
  const mins = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function FloorPlan({
  initialTables,
  waiters,
}: {
  initialTables: FloorTable[];
  waiters: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [tables, setTables] = useState<FloorTable[]>(initialTables);
  const [active, setActive] = useState<FloorTable | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [pending, startTransition] = useTransition();

  // Open-table form
  const [guests, setGuests] = useState(2);
  const [waiterId, setWaiterId] = useState('');
  const [custName, setCustName] = useState('');
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS[0]);

  useEffect(() => setTables(initialTables), [initialTables]);

  // Real-time: a Server-Sent Events stream pushes a "refresh" only when table /
  // session / order data changes; a slow interval is kept as a safety net.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const es = new EventSource('/api/floor-stream');
    es.onmessage = (e) => {
      if (e.data === 'refresh') router.refresh();
    };
    const fallback = setInterval(() => router.refresh(), 60_000);
    return () => {
      clearInterval(tick);
      clearInterval(fallback);
      es.close();
    };
  }, [router]);

  const counts = useMemo(() => {
    const c = { total: tables.length } as Record<string, number>;
    for (const s of TABLE_STATES) c[s] = 0;
    for (const t of tables) c[t.state] += 1;
    return c;
  }, [tables]);

  const doOpen = (t: FloorTable) => {
    startTransition(async () => {
      await openTableSession(t.id, { customerCount: guests, waiterId: waiterId || undefined, customerName: custName || undefined }).catch(() => {});
      router.refresh();
      setActive(null);
    });
  };

  const doClose = (t: FloorTable) => {
    if (!t.session) return;
    startTransition(async () => {
      await closeTableSession(t.session!.id, { paymentMethod: payMethod }).catch(() => {});
      router.refresh();
      setActive(null);
    });
  };

  const doState = (t: FloorTable, state: TableState) => {
    setTables((prev) => prev.map((x) => (x.id === t.id ? { ...x, state } : x)));
    setActive((cur) => (cur && cur.id === t.id ? { ...cur, state } : cur));
    startTransition(() => {
      setTableState(t.id, state).catch(() => {});
    });
  };

  const STAT_CHIPS: { key: string; label: string; tone: string }[] = [
    { key: 'total', label: 'Total', tone: 'text-fg' },
    { key: 'AVAILABLE', label: 'Available', tone: 'text-success' },
    { key: 'OCCUPIED', label: 'Occupied', tone: 'text-danger' },
    { key: 'RESERVED', label: 'Reserved', tone: 'text-warn' },
    { key: 'WAITING_PAYMENT', label: 'Awaiting Pay', tone: 'text-[#b45309]' },
    { key: 'CLEANING', label: 'Cleaning', tone: 'text-info' },
    { key: 'OUT_OF_SERVICE', label: 'Out of Service', tone: 'text-fg-muted' },
  ];

  return (
    <div className="space-y-5">
      {/* Live stats */}
      <div className="card flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
        {STAT_CHIPS.map((s) => (
          <div key={s.key}>
            <p className={cn('font-display text-2xl font-semibold', s.tone)}>{counts[s.key] ?? 0}</p>
            <p className="text-xs text-fg-muted">{s.label}</p>
          </div>
        ))}
        <button
          type="button"
          onClick={() => router.refresh()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Grid */}
      {tables.length === 0 ? (
        <div className="card px-5 py-16 text-center text-sm text-fg-muted">
          No tables yet — add tables in Table Management.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tables.map((t) => {
            const ui = STATE_UI[t.state];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t)}
                className={cn('rounded-xl border p-4 text-left transition-transform hover:-translate-y-0.5', ui.card)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold">Table {t.number}</p>
                    {t.name && <p className="text-xs text-fg-muted">{t.name}</p>}
                  </div>
                  <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', ui.badge)}>{ui.label}</span>
                </div>

                {t.session ? (
                  <div className="mt-3 space-y-1 text-xs text-fg-muted">
                    <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {t.session.customerCount} guests{t.session.waiterName ? ` · ${t.session.waiterName}` : ''}</p>
                    <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {fmtDuration(t.session.openedAt, now)} · {t.session.orderCount} orders</p>
                    <p className="flex items-center gap-1.5 font-semibold text-fg"><Receipt className="h-3.5 w-3.5" /> {formatCurrency(t.session.currentBill)}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-fg-muted">Seats {t.capacity}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail / actions */}
      <Modal open={!!active} onClose={() => setActive(null)} title={active ? `Table ${active.number}` : ''}>
        {active && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', STATE_UI[active.state].badge)}>
                {STATE_UI[active.state].label}
              </span>
              {active.name && <span className="text-sm text-fg-muted">{active.name} · seats {active.capacity}</span>}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/pos/${active.id}`)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
              >
                <Receipt className="h-4 w-4" /> Open POS {active.session ? `· ${formatCurrency(active.session.currentBill)}` : ''}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/table-history/${active.id}`)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-bg"
              >
                History
              </button>
            </div>

            {active.session ? (
              <>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Guests', String(active.session.customerCount)],
                    ['Waiter', active.session.waiterName ?? '—'],
                    ['Duration', fmtDuration(active.session.openedAt, now)],
                    ['Orders', String(active.session.orderCount)],
                    ['Customer', active.session.customerName ?? '—'],
                    ['Current bill', formatCurrency(active.session.currentBill)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-border px-3 py-2">
                      <dt className="text-xs text-fg-muted">{k}</dt>
                      <dd className="mt-0.5 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="rounded-xl border border-border p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Close & pay</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => doClose(active)}
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
                    >
                      Close table · {formatCurrency(active.session.currentBill)}
                    </button>
                    {active.state !== 'WAITING_PAYMENT' && (
                      <button
                        type="button"
                        onClick={() => doState(active, 'WAITING_PAYMENT')}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-bg"
                      >
                        Awaiting payment
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-border p-4">
                <p className="mb-3 text-xs uppercase tracking-wide text-fg-muted">Open table</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="mb-1 block text-xs text-fg-muted">Guests</span>
                    <input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs text-fg-muted">Waiter</span>
                    <select value={waiterId} onChange={(e) => setWaiterId(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
                      <option value="">— None —</option>
                      {waiters.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="col-span-2 text-sm">
                    <span className="mb-1 block text-xs text-fg-muted">Customer name (optional)</span>
                    <input value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent" placeholder="Walk-in" />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => doOpen(active)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
                >
                  <UserRound className="h-4 w-4" /> Open & seat
                </button>
              </div>
            )}

            {/* State quick-set */}
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Set state</p>
              <div className="flex flex-wrap gap-2">
                {TABLE_STATES.filter((s) => s !== active.state).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => doState(active, s)}
                    disabled={!!active.session && (s === 'AVAILABLE' || s === 'OUT_OF_SERVICE')}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      STATE_UI[s].badge,
                    )}
                    title={active.session && (s === 'AVAILABLE' || s === 'OUT_OF_SERVICE') ? 'Close the open session first' : undefined}
                  >
                    {STATE_UI[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
