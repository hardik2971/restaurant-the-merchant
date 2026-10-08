'use client';

import { useState } from 'react';
import { Mail, Phone, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ResStatusBadge } from '@/components/reservations/ResStatusBadge';
import { ReservationProgress } from '@/components/reservations/ReservationProgress';
import { type ReservationEdit } from '@/lib/actions';
import {
  nextStatuses,
  KIND_LABELS,
  STATUS_LABELS,
  type Reservation,
  type ReservationStatus,
} from '@/lib/reservations-data';
import { cn, formatDate } from '@/lib/utils';

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex items-center justify-between gap-6 py-2.5 text-sm">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function ReservationDetail({
  reservation,
  onClose,
  onStatusChange,
  onEdit,
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (id: string, patch: ReservationEdit) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ReservationEdit>({});

  if (!reservation) return null;
  const r = reservation;
  const transitions = nextStatuses(r.kind, r.status);
  const closed = r.status === 'COMPLETED' || r.status === 'CANCELED' || r.status === 'NO_SHOW';

  const startEdit = () => {
    setDraft({
      date: r.date.slice(0, 10),
      time: r.time ?? '',
      guests: r.guests,
      occasion: r.occasion ?? '',
      requests: r.requests ?? '',
    });
    setEditing(true);
  };

  const save = () => {
    onEdit(r.id, draft);
    setEditing(false);
  };

  const fieldClass =
    'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent';

  return (
    <Modal open={!!r} onClose={onClose} title={r.reference}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            {KIND_LABELS[r.kind]}
          </span>
          <ResStatusBadge status={r.status} />
        </div>

        {/* Step-wise status progress */}
        <ReservationProgress kind={r.kind} status={r.status} />

        {/* Contact */}
        <div className="rounded-xl border border-border p-4">
          <p className="font-display text-base font-semibold">{r.name}</p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-fg-muted">
            <a href={`mailto:${r.email}`} className="inline-flex items-center gap-2 hover:text-accent">
              <Mail className="h-4 w-4" /> {r.email}
            </a>
            <a href={`tel:${r.phone}`} className="inline-flex items-center gap-2 hover:text-accent">
              <Phone className="h-4 w-4" /> {r.phone}
            </a>
          </div>
        </div>

        {/* Details — read or edit (TABLE bookings are editable) */}
        {editing && r.kind === 'TABLE' ? (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-xs text-fg-muted">Date</span>
                <input
                  type="date"
                  value={draft.date ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-fg-muted">Time</span>
                <input
                  type="time"
                  value={draft.time ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                  className={fieldClass}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-fg-muted">Guests</span>
                <input
                  type="number"
                  min={1}
                  value={draft.guests ?? 1}
                  onChange={(e) => setDraft((d) => ({ ...d, guests: Number(e.target.value) }))}
                  className={fieldClass}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-fg-muted">Occasion</span>
                <input
                  value={draft.occasion ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, occasion: e.target.value }))}
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-fg-muted">Notes / requests</span>
              <textarea
                rows={2}
                value={draft.requests ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, requests: e.target.value }))}
                className={cn(fieldClass, 'resize-none')}
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-bg">
                Cancel
              </button>
              <button type="button" onClick={save} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep">
                Save changes
              </button>
            </div>
          </div>
        ) : (
          <dl className="divide-y divide-border rounded-xl border border-border px-4">
            <Row label="Date" value={formatDate(r.date, 'EEE, MMM d, yyyy')} />
            {r.kind === 'TABLE' ? (
              <>
                <Row label="Time" value={r.time} />
                <Row label="Guests" value={r.guests} />
                <Row label="Occasion" value={r.occasion} />
                <Row label="Requests" value={r.requests} />
              </>
            ) : (
              <>
                <Row label="Event type" value={r.eventType} />
                <Row label="Estimated guests" value={r.guestRange} />
                <Row label="Space" value={r.space} />
                <Row label="Company" value={r.company} />
                <Row label="Details" value={r.message} />
              </>
            )}
          </dl>
        )}

        {/* Edit toggle — table bookings that aren't closed out */}
        {r.kind === 'TABLE' && !editing && !closed && (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-deep"
          >
            <Pencil className="h-4 w-4" /> Edit reservation
          </button>
        )}

        {/* Workflow */}
        {!editing && transitions.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Update status</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(r.id, s)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    s === 'CANCELED' || s === 'NO_SHOW'
                      ? 'border border-danger/40 text-danger hover:bg-danger-soft'
                      : 'bg-accent text-white hover:bg-accent-deep',
                  )}
                >
                  Mark {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        ) : !editing ? (
          <p className="text-sm text-fg-muted">
            This reservation is {STATUS_LABELS[r.status]} — no further actions.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
