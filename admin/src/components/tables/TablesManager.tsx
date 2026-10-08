'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Search, Pencil, Trash2, QrCode, Download, Printer, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableForm } from '@/components/tables/TableForm';
import { createTable, updateTable, deleteTable, setTableStatus } from '@/lib/actions';
import { type TableInput } from '@/schemas/table';
import { TABLE_STATUS_LABELS, type RestaurantTable, type TableStatus } from '@/lib/tables-data';
import { cn } from '@/lib/utils';

const WEBSITE_URL = (process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const STATUS_FILTERS: (TableStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'INACTIVE'];

const tableUrl = (code: string) => `${WEBSITE_URL}/order?table=${encodeURIComponent(code)}`;
const qrSrc = (code: string, size = 220) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(tableUrl(code))}`;

async function downloadQR(t: RestaurantTable) {
  try {
    const res = await fetch(qrSrc(t.code, 600));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${t.number}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

function printQR(t: RestaurantTable) {
  const w = window.open('', '_blank', 'width=420,height=620');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Table ${t.number} · QR</title>
    <style>body{font-family:system-ui,sans-serif;text-align:center;padding:32px;color:#141210}
    h1{font-size:18px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 4px}
    p{color:#6b6b6b;margin:4px 0 20px}img{width:300px;height:300px}</style></head>
    <body><h1>The Merchant Boston</h1>
    <p>Scan to order &middot; Table ${t.number}${t.name ? ' &middot; ' + t.name : ''}</p>
    <img src="${qrSrc(t.code, 300)}" onload="window.focus();window.print();" alt="QR" />
    </body></html>`);
  w.document.close();
}

const BLANK: TableInput = { number: '', name: '', status: 'ACTIVE' };

export function TablesManager({ initialTables }: { initialTables: RestaurantTable[] }) {
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'ALL'>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tables.filter(
      (t) =>
        (statusFilter === 'ALL' || t.status === statusFilter) &&
        (q === '' || t.number.toLowerCase().includes(q) || (t.name ?? '').toLowerCase().includes(q)),
    );
  }, [tables, query, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: RestaurantTable) => {
    setEditing(t);
    setFormOpen(true);
  };

  const toggleStatus = (t: RestaurantTable) => {
    const next: TableStatus = t.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTables((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    startTransition(() => {
      setTableStatus(t.id, next).catch(() => {});
    });
  };

  const remove = (t: RestaurantTable) => {
    if (!confirm(`Delete table ${t.number}? Its QR code will stop working.`)) return;
    setTables((prev) => prev.filter((x) => x.id !== t.id));
    startTransition(() => {
      deleteTable(t.id).catch(() => {});
    });
  };

  const submit = async (values: TableInput) => {
    if (editing) {
      setTables((prev) =>
        prev.map((t) => (t.id === editing.id ? { ...t, number: values.number, name: values.name || undefined, status: values.status } : t)),
      );
      startTransition(() => {
        updateTable(editing.id, values).catch(() => {});
      });
      setFormOpen(false);
    } else {
      const created = await createTable(values).catch(() => null);
      if (created) setTables((prev) => [created, ...prev]);
      setFormOpen(false);
    }
  };

  const formDefaults: TableInput = editing
    ? { number: editing.number, name: editing.name ?? '', status: editing.status }
    : BLANK;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
                statusFilter === s
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {s === 'ALL' ? 'All' : TABLE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tables…"
              className="w-48 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card px-5 py-16 text-center text-sm text-fg-muted">No tables match your filters.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((t) => (
            <div key={t.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-semibold">Table {t.number}</p>
                  {t.name && <p className="text-xs text-fg-muted">{t.name}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => toggleStatus(t)}
                  title={t.status === 'ACTIVE' ? 'Click to deactivate' : 'Click to activate'}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
                    t.status === 'ACTIVE' ? 'bg-success-soft text-success' : 'bg-bg text-fg-muted',
                  )}
                >
                  {TABLE_STATUS_LABELS[t.status]}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setQrTable(t)}
                className="mt-3 grid place-items-center rounded-lg border border-border bg-white p-3 transition-colors hover:border-accent/40"
                title="View QR code"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrSrc(t.code, 160)} alt={`Table ${t.number} QR`} className="h-28 w-28" />
              </button>

              <p className="mt-2 text-center text-[11px] text-fg-muted">{t.orderCount} orders</p>

              <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-border pt-3">
                <button type="button" onClick={() => setQrTable(t)} aria-label="QR" title="QR" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-accent-soft hover:text-accent">
                  <QrCode className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => downloadQR(t)} aria-label="Download" title="Download" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-accent-soft hover:text-accent">
                  <Download className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => printQR(t)} aria-label="Print" title="Print" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-accent-soft hover:text-accent">
                  <Printer className="h-4 w-4" />
                </button>
                <span className="mx-1 h-4 w-px bg-border" />
                <button type="button" onClick={() => openEdit(t)} aria-label="Edit" title="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-accent-soft hover:text-accent">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(t)} aria-label="Delete" title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted hover:bg-danger-soft hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit table' : 'Add table'}>
        <TableForm
          defaultValues={formDefaults}
          onSubmit={submit}
          onCancel={() => setFormOpen(false)}
          submitLabel={editing ? 'Save changes' : 'Add table'}
        />
      </Modal>

      {/* QR detail */}
      <Modal open={!!qrTable} onClose={() => setQrTable(null)} title={qrTable ? `Table ${qrTable.number} · QR code` : ''}>
        {qrTable && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid w-fit place-items-center rounded-xl border border-border bg-white p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc(qrTable.code, 260)} alt={`Table ${qrTable.number} QR`} className="h-56 w-56" />
            </div>
            <a
              href={tableUrl(qrTable.code)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all text-xs text-accent hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {tableUrl(qrTable.code)}
            </a>
            <div className="flex justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => downloadQR(qrTable)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-bg"
              >
                <Download className="h-4 w-4" /> Download
              </button>
              <button
                type="button"
                onClick={() => printQR(qrTable)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
