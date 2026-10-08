'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Printer, ChefHat, Receipt, Combine } from 'lucide-react';
import {
  openTableSession,
  addSessionOrder,
  updateSessionBilling,
  closeTableSession,
  decrementSessionItem,
  mergeSessions,
  addPayment,
} from '@/lib/actions';
import { PAYMENT_METHODS, type PosTable, type PosSession, type PosLine, type MergeTarget } from '@/lib/floor-data';
import { type MenuItem } from '@/lib/menu-data';
import { cn, formatCurrency } from '@/lib/utils';

function printDoc(title: string, inner: string) {
  const w = window.open('', '_blank', 'width=400,height=680');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:'Courier New',monospace;font-size:13px;padding:16px;color:#000;width:320px;margin:0 auto}
    h1{font-size:16px;text-align:center;margin:0 0 2px} .muted{color:#555;font-size:11px;text-align:center;margin:0 0 8px}
    table{width:100%;border-collapse:collapse} td{padding:2px 0;vertical-align:top} .r{text-align:right;white-space:nowrap}
    .sep{border-top:1px dashed #000;margin:8px 0} .row{display:flex;justify-content:space-between} .big{font-weight:bold;font-size:15px}
  </style></head><body>${inner}<script>window.onload=function(){window.focus();window.print()}</script></body></html>`);
  w.document.close();
}

function kotHtml(tableNumber: string, lines: PosLine[]) {
  const rows = lines.map((l) => `<tr><td>${l.qty} ×</td><td>${l.name}</td></tr>`).join('');
  return `<h1>KITCHEN ORDER</h1><p class="muted">Table ${tableNumber} · ${new Date().toLocaleTimeString()}</p>
    <div class="sep"></div><table>${rows}</table>`;
}

export function PosScreen({
  table,
  session,
  menu,
  waiters,
  mergeTargets = [],
}: {
  table: PosTable;
  session: PosSession | null;
  menu: MenuItem[];
  waiters: { id: string; name: string }[];
  mergeTargets?: MergeTarget[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // ----- Open-table state (when no session) -----
  const [guests, setGuests] = useState(2);
  const [waiterId, setWaiterId] = useState('');
  const [custName, setCustName] = useState('');

  const openTable = () => {
    startTransition(async () => {
      await openTableSession(table.id, { customerCount: guests, waiterId: waiterId || undefined, customerName: custName || undefined }).catch(() => {});
      router.refresh();
    });
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-md">
        <BackLink router={router} />
        <div className="card mt-3 p-6">
          <h2 className="font-display text-xl font-semibold">Open Table {table.number}</h2>
          <p className="mt-1 text-sm text-fg-muted">Seat guests to start a session.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-fg-muted">Guests</span>
              <input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-fg-muted">Waiter</span>
              <select value={waiterId} onChange={(e) => setWaiterId(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
                <option value="">— None —</option>
                {waiters.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
            <label className="col-span-2 text-sm">
              <span className="mb-1 block text-xs text-fg-muted">Customer (optional)</span>
              <input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Walk-in" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent" />
            </label>
          </div>
          <button type="button" disabled={pending} onClick={openTable} className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
            {pending ? 'Opening…' : 'Open & seat'}
          </button>
        </div>
      </div>
    );
  }

  return <PosActive table={table} session={session} menu={menu} mergeTargets={mergeTargets} />;
}

function BackLink({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <button type="button" onClick={() => router.push('/floor')} className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-accent">
      <ArrowLeft className="h-4 w-4" /> Back to floor
    </button>
  );
}

function PosActive({
  table,
  session,
  menu,
  mergeTargets,
}: {
  table: PosTable;
  session: PosSession;
  menu: MenuItem[];
  mergeTargets: MergeTarget[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(session.discount);
  const [tax, setTax] = useState(session.tax);
  const [service, setService] = useState(session.serviceCharge);
  const [tip, setTip] = useState(session.tip);
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [mergeId, setMergeId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod2, setPayMethod2] = useState<string>(PAYMENT_METHODS[0]);

  const line = (menuItemId: string, delta: 1 | -1) => {
    startTransition(async () => {
      if (delta === 1) await addSessionOrder(session.id, [{ menuItemId, qty: 1 }]).catch(() => {});
      else await decrementSessionItem(session.id, menuItemId).catch(() => {});
      router.refresh();
    });
  };

  const doMerge = () => {
    if (!mergeId) return;
    startTransition(async () => {
      await mergeSessions(mergeId, session.id).catch(() => {});
      router.refresh();
    });
  };

  const doAddPayment = () => {
    const amt = Number(payAmount);
    if (!(amt > 0)) return;
    startTransition(async () => {
      await addPayment(session.id, { amount: amt, method: payMethod2 }).catch(() => {});
      setPayAmount('');
      router.refresh();
    });
  };

  const available = useMemo(() => menu.filter((m) => m.available), [menu]);
  const cats = useMemo(() => ['All', ...Array.from(new Set(available.map((m) => m.category)))], [available]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available.filter((m) => (cat === 'All' || m.category === cat) && (!q || m.name.toLowerCase().includes(q)));
  }, [available, cat, query]);

  const cartLines: PosLine[] = useMemo(
    () => available.filter((m) => cart[m.id]).map((m) => ({ menuItemId: m.id, name: m.name, qty: cart[m.id], price: m.price })),
    [available, cart],
  );
  const cartTotal = cartLines.reduce((s, l) => s + l.qty * l.price, 0);
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const sub = (id: string) => setCart((c) => { const n = { ...c }; const q = (n[id] ?? 0) - 1; if (q <= 0) delete n[id]; else n[id] = q; return n; });

  const previewTotal = Math.max(0, session.subtotal - discount + tax + service + tip);

  const sendToKitchen = () => {
    if (!cartCount) return;
    const items = available.filter((m) => cart[m.id]).map((m) => ({ menuItemId: m.id, qty: cart[m.id] }));
    printDoc('KOT', kotHtml(table.number, cartLines));
    startTransition(async () => {
      await addSessionOrder(session.id, items).catch(() => {});
      setCart({});
      router.refresh();
    });
  };

  const saveBilling = () => {
    startTransition(async () => {
      await updateSessionBilling(session.id, { discount, tax, serviceCharge: service, tip }).catch(() => {});
      router.refresh();
    });
  };

  const printInvoice = () => {
    const rows = session.lines.map((l) => `<tr><td>${l.qty} × ${l.name}</td><td class="r">${formatCurrency(l.qty * l.price)}</td></tr>`).join('');
    printDoc('Invoice', `<h1>The Merchant Boston</h1><p class="muted">Table ${table.number} · ${new Date().toLocaleString()}</p>
      <div class="sep"></div><table>${rows}</table><div class="sep"></div>
      <div class="row"><span>Subtotal</span><span>${formatCurrency(session.subtotal)}</span></div>
      ${discount ? `<div class="row"><span>Discount</span><span>-${formatCurrency(discount)}</span></div>` : ''}
      ${tax ? `<div class="row"><span>Tax</span><span>${formatCurrency(tax)}</span></div>` : ''}
      ${service ? `<div class="row"><span>Service</span><span>${formatCurrency(service)}</span></div>` : ''}
      ${tip ? `<div class="row"><span>Tip</span><span>${formatCurrency(tip)}</span></div>` : ''}
      <div class="sep"></div><div class="row big"><span>TOTAL</span><span>${formatCurrency(previewTotal)}</span></div>`);
  };

  const closeAndPay = () => {
    startTransition(async () => {
      await updateSessionBilling(session.id, { discount, tax, serviceCharge: service, tip }).catch(() => {});
      await closeTableSession(session.id, { paymentMethod: payMethod }).catch(() => {});
      router.push('/floor');
    });
  };

  const adj = (label: string, value: number, set: (n: number) => void) => (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="inline-flex items-center gap-1">
        <span className="text-fg-muted">$</span>
        <input type="number" min={0} step="0.01" value={value} onChange={(e) => set(Number(e.target.value) || 0)} className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-right text-sm outline-none focus:border-accent" />
      </span>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <BackLink router={router} />
        <span className="text-sm text-fg-muted">
          Table {table.number}{table.name ? ` · ${table.name}` : ''} · {session.customerCount} guests{session.waiterName ? ` · ${session.waiterName}` : ''}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Menu picker */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes…" className="w-48 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button key={c} type="button" onClick={() => setCat(c)} className={cn('rounded-pill px-3 py-1 text-xs font-medium transition-colors', cat === c ? 'bg-accent text-white' : 'border border-border text-fg-muted hover:border-accent/40')}>{c}</button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filtered.map((m) => (
              <button key={m.id} type="button" onClick={() => add(m.id)} className="flex flex-col rounded-xl border border-border p-3 text-left transition-colors hover:border-accent/40">
                <span className="line-clamp-2 text-sm font-medium">{m.name}</span>
                <span className="mt-auto pt-2 text-sm font-semibold text-accent">{formatCurrency(m.price)}</span>
                {cart[m.id] ? <span className="mt-1 text-xs text-fg-muted">In cart: {cart[m.id]}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {/* Bill */}
        <div className="space-y-4">
          {/* New items cart */}
          {cartCount > 0 && (
            <div className="card p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">New items</p>
              <ul className="space-y-1.5 text-sm">
                {available.filter((m) => cart[m.id]).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{m.name}</span>
                    <span className="flex items-center gap-1.5">
                      <button type="button" onClick={() => sub(m.id)} className="grid h-6 w-6 place-items-center rounded border border-border">−</button>
                      <span className="w-5 text-center">{cart[m.id]}</span>
                      <button type="button" onClick={() => add(m.id)} className="grid h-6 w-6 place-items-center rounded border border-border">+</button>
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" disabled={pending} onClick={sendToKitchen} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
                <ChefHat className="h-4 w-4" /> Send to kitchen · {formatCurrency(cartTotal)}
              </button>
            </div>
          )}

          {/* Merge another table into this one */}
          {mergeTargets.length > 0 && (
            <div className="card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Merge table</p>
              <div className="flex gap-2">
                <select value={mergeId} onChange={(e) => setMergeId(e.target.value)} className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
                  <option value="">Select a table…</option>
                  {mergeTargets.map((m) => <option key={m.sessionId} value={m.sessionId}>Table {m.number}</option>)}
                </select>
                <button type="button" disabled={pending || !mergeId} onClick={doMerge} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-bg disabled:opacity-50">
                  <Combine className="h-4 w-4" /> Merge
                </button>
              </div>
            </div>
          )}

          {/* Running bill */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Bill</p>
              <button type="button" onClick={() => printDoc('KOT', kotHtml(table.number, session.lines))} className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-accent"><Printer className="h-3.5 w-3.5" /> KOT</button>
            </div>
            {session.lines.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">No items yet — add from the menu.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {session.lines.map((l) => (
                  <li key={l.menuItemId} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <button type="button" disabled={pending} onClick={() => line(l.menuItemId, -1)} className="grid h-5 w-5 place-items-center rounded border border-border text-fg-muted hover:border-danger hover:text-danger disabled:opacity-50">−</button>
                      <span className="w-4 text-center text-xs font-medium">{l.qty}</span>
                      <button type="button" disabled={pending} onClick={() => line(l.menuItemId, 1)} className="grid h-5 w-5 place-items-center rounded border border-border text-fg-muted hover:border-accent hover:text-accent disabled:opacity-50">+</button>
                      <span className="min-w-0 truncate">{l.name}</span>
                    </span>
                    <span className="whitespace-nowrap text-fg-muted">{formatCurrency(l.qty * l.price)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between text-sm"><span className="text-fg-muted">Subtotal</span><span className="font-medium">{formatCurrency(session.subtotal)}</span></div>
              {adj('Discount', discount, setDiscount)}
              {adj('Tax', tax, setTax)}
              {adj('Service', service, setService)}
              {adj('Tip', tip, setTip)}
              <button type="button" onClick={saveBilling} disabled={pending} className="text-xs font-medium text-accent hover:text-accent-deep disabled:opacity-60">Save adjustments</button>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display text-xl font-semibold">{formatCurrency(previewTotal)}</span>
              </div>
              {session.paid > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm"><span className="text-fg-muted">Paid</span><span className="font-medium text-success">{formatCurrency(session.paid)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-fg-muted">Remaining</span><span className="font-medium">{formatCurrency(Math.max(0, previewTotal - session.paid))}</span></div>
                </>
              )}
            </div>

            {/* Split / partial payment */}
            <div className="mt-3 rounded-lg border border-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Split / partial payment</p>
              {session.payments.length > 0 && (
                <ul className="mb-2 space-y-1 text-xs text-fg-muted">
                  {session.payments.map((p, i) => (
                    <li key={i} className="flex justify-between"><span>{p.method}</span><span>{formatCurrency(p.amount)}</span></li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input type="number" min={0} step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount" className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent" />
                <select value={payMethod2} onChange={(e) => setPayMethod2(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <button type="button" disabled={pending} onClick={doAddPayment} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-bg disabled:opacity-60">Add</button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <button type="button" onClick={printInvoice} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-bg"><Receipt className="h-4 w-4" /> Print invoice</button>
              <div className="flex gap-2">
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <button type="button" onClick={closeAndPay} disabled={pending} className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
                  Close &amp; Pay{session.paid > 0 ? ` · ${formatCurrency(Math.max(0, previewTotal - session.paid))}` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
