'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, Users, UserCheck, Coffee, UserX, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StaffForm } from '@/components/staff/StaffForm';
import {
  setEmployeeStatus as persistEmployeeStatus,
  createStaff,
  updateStaff,
  deleteStaff,
  setStaffActive,
} from '@/lib/actions';
import { STAFF_ROLES, type StaffInput, type StaffRole } from '@/schemas/staff';
import { STATUS_LABELS, statusCounts, type DutyStatus, type Employee } from '@/lib/employees-data';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: (DutyStatus | 'ALL')[] = ['ALL', 'ON_DUTY', 'ON_BREAK', 'ABSENT', 'OFF'];
const ACTIVE_FILTERS = [
  { value: 'ALL', label: 'All accounts' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const;
const PAGE_SIZE = 12;

const STATUS_STYLES: Record<DutyStatus, string> = {
  ON_DUTY: 'bg-success-soft text-success',
  ON_BREAK: 'bg-warn-soft text-warn',
  ABSENT: 'bg-danger-soft text-danger',
  OFF: 'bg-bg text-fg-muted',
};

const AVATAR_COLORS = ['bg-accent', 'bg-[#7c8467]', 'bg-info', 'bg-gold', 'bg-[#9a6cf1]'];

function Avatar({ name, i }: { name: string; i: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <span
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white',
        AVATAR_COLORS[i % AVATAR_COLORS.length],
      )}
    >
      {initials}
    </span>
  );
}

const BLANK: StaffInput = { name: '', email: '', phone: '', password: '', role: 'Waiter', active: true };

export function StaffManager({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [status, setStatus] = useState<DutyStatus | 'ALL'>('ALL');
  const [role, setRole] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => statusCounts(employees), [employees]);
  const roleOptions = useMemo(
    () => Array.from(new Set([...STAFF_ROLES, ...employees.map((e) => e.role)])),
    [employees],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter(
      (e) =>
        (status === 'ALL' || e.status === status) &&
        (role === 'ALL' || e.role === role) &&
        (activeFilter === 'ALL' || (activeFilter === 'ACTIVE' ? e.active : !e.active)) &&
        (q === '' || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)),
    );
  }, [employees, status, role, activeFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const resetPage = () => setPage(0);

  const setDuty = (id: string, next: DutyStatus) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: next } : e)));
    startTransition(() => {
      persistEmployeeStatus(id, next).catch(() => {});
    });
  };

  const toggleActive = (e: Employee) => {
    const next = !e.active;
    setEmployees((prev) => prev.map((x) => (x.id === e.id ? { ...x, active: next } : x)));
    startTransition(() => {
      setStaffActive(e.id, next).catch(() => {});
    });
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setFormOpen(true);
  };

  const remove = (e: Employee) => {
    if (!confirm(`Delete staff member "${e.name}"?`)) return;
    setEmployees((prev) => prev.filter((x) => x.id !== e.id));
    startTransition(() => {
      deleteStaff(e.id).catch(() => {});
    });
  };

  const submit = (values: StaffInput) => {
    if (editing) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editing.id ? { ...e, name: values.name, email: values.email, phone: values.phone || undefined, role: values.role, active: values.active } : e,
        ),
      );
      startTransition(() => {
        updateStaff(editing.id, values).catch(() => {});
      });
    } else {
      setEmployees((prev) => [
        {
          id: `tmp-${Date.now()}`,
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          role: values.role,
          outlet: '—',
          active: values.active,
          status: 'OFF',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      startTransition(() => {
        createStaff(values).catch(() => {});
      });
    }
    setFormOpen(false);
  };

  const formDefaults: StaffInput = editing
    ? {
        name: editing.name,
        email: editing.email,
        phone: editing.phone ?? '',
        password: '',
        role: (STAFF_ROLES as readonly string[]).includes(editing.role) ? (editing.role as StaffRole) : 'Waiter',
        active: editing.active,
      }
    : BLANK;

  const STAT_CARDS = [
    { label: 'Total Staff', value: employees.length, icon: Users },
    { label: 'Active', value: employees.filter((e) => e.active).length, icon: UserCheck },
    { label: 'On Duty', value: counts.ON_DUTY, icon: Coffee },
    { label: 'Inactive', value: employees.filter((e) => !e.active).length, icon: UserX },
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
              onClick={() => { setStatus(s); resetPage(); }}
              className={cn(
                'rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors',
                status === s ? 'bg-accent text-white' : 'border border-border bg-surface text-fg-muted hover:border-accent/40',
              )}
            >
              {s === 'ALL' ? 'All duty' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value as typeof activeFilter); resetPage(); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent"
          >
            {ACTIVE_FILTERS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); resetPage(); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted outline-none focus:border-accent"
          >
            <option value="ALL">All roles</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetPage(); }}
              placeholder="Search staff…"
              className="w-44 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="px-5 py-3 font-medium">Staff</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Duty</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((e, i) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={e.name} i={i} />
                    <div className="min-w-0">
                      <p className="font-medium">{e.name}</p>
                      <p className="truncate text-xs text-fg-muted">{e.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-fg-muted">{e.phone ?? '—'}</td>
                <td className="px-5 py-3 text-fg-muted">{e.role}</td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(e)}
                    title={e.active ? 'Click to deactivate' : 'Click to activate'}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
                      e.active ? 'bg-success-soft text-success' : 'bg-bg text-fg-muted',
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {e.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={e.status}
                    onChange={(ev) => setDuty(e.id, ev.target.value as DutyStatus)}
                    className={cn(
                      'rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-accent',
                      STATUS_STYLES[e.status],
                    )}
                  >
                    {(Object.keys(STATUS_LABELS) as DutyStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(e)}
                      aria-label="Edit"
                      className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e)}
                      aria-label="Delete"
                      className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-fg-muted">
                  No staff match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-fg-muted">
        <span>{filtered.length} staff · page {safePage + 1} of {pageCount}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border transition-colors hover:border-accent/40 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border transition-colors hover:border-accent/40 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit staff' : 'Add staff'}>
        <StaffForm
          defaultValues={formDefaults}
          isEdit={!!editing}
          onSubmit={submit}
          onCancel={() => setFormOpen(false)}
          submitLabel={editing ? 'Save changes' : 'Add staff'}
        />
      </Modal>
    </div>
  );
}
