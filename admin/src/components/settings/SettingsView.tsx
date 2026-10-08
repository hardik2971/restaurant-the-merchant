'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import type { Role } from '@prisma/client';
import { can, type Action } from '@/lib/rbac';
import { profileSchema, passwordSchema, type ProfileInput, type PasswordInput } from '@/schemas/settings';
import { updateProfile, changePassword } from '@/lib/actions';
import type { ProfileData, TeamMember } from '@/lib/queries';
import { cn } from '@/lib/utils';

const field =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent';
const label = 'mb-1.5 block text-sm font-medium';

const ROLES: Role[] = ['OWNER', 'MANAGER', 'STAFF'];
const ACTIONS: { action: Action; label: string }[] = [
  { action: 'view:dashboard', label: 'Dashboard' },
  { action: 'manage:orders', label: 'Orders' },
  { action: 'manage:menu', label: 'Menu' },
  { action: 'manage:reservations', label: 'Reservations' },
  { action: 'manage:outlets', label: 'Outlets' },
  { action: 'manage:staff', label: 'Staff' },
  { action: 'manage:customers', label: 'Customers' },
  { action: 'manage:inventory', label: 'Inventory' },
  { action: 'view:reports', label: 'Reports' },
  { action: 'manage:settings', label: 'Settings' },
];

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-accent-soft text-accent',
  MANAGER: 'bg-info-soft text-info',
  STAFF: 'bg-bg text-fg-muted',
};

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-fg-muted">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SettingsView({
  profile,
  team,
  account,
}: {
  profile: ProfileData;
  team: TeamMember[];
  account: { name: string; email: string; role: string };
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <RestaurantForm profile={profile} />
      <PasswordForm />
      <TeamCard team={team} account={account} />
      <RolesMatrix />
    </div>
  );
}

function RestaurantForm({ profile }: { profile: ProfileData }) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: profile });

  const onSubmit = async (values: ProfileInput) => {
    setSaved(false);
    await updateProfile(values).catch(() => {});
    setSaved(true);
  };

  return (
    <Section title="Restaurant Profile" desc="Brand name, currency, and contact details.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={label}>Restaurant name</label>
          <input {...register('name')} className={field} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Currency</label>
            <input {...register('currency')} className={field} placeholder="USD" />
          </div>
          <div>
            <label className={label}>Timezone</label>
            <input {...register('timezone')} className={field} placeholder="America/New_York" />
          </div>
        </div>
        <div>
          <label className={label}>Address</label>
          <input {...register('address')} className={field} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Phone</label>
            <input {...register('phone')} className={field} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input {...register('email')} className={field} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

function PasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (values: PasswordInput) => {
    setMsg(null);
    const res = await changePassword(values).catch(() => ({ ok: false, error: 'Something went wrong' }));
    if (res.ok) {
      setMsg({ ok: true, text: 'Password updated' });
      reset();
    } else {
      setMsg({ ok: false, text: res.error ?? 'Failed' });
    }
  };

  return (
    <Section title="Change Password" desc="Update your account password.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {msg && (
          <p className={cn('rounded-lg px-3 py-2 text-sm', msg.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
            {msg.text}
          </p>
        )}
        <div>
          <label className={label}>Current password</label>
          <input type="password" {...register('currentPassword')} className={field} />
          {errors.currentPassword && <p className="mt-1 text-xs text-danger">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className={label}>New password</label>
          <input type="password" {...register('newPassword')} className={field} />
          {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </button>
      </form>
    </Section>
  );
}

function TeamCard({ team, account }: { team: TeamMember[]; account: { name: string; email: string; role: string } }) {
  return (
    <Section title="Team" desc={`Signed in as ${account.name} (${account.role}).`}>
      <ul className="divide-y divide-border">
        {team.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-fg-muted">{m.email}</p>
            </div>
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', ROLE_BADGE[m.role])}>
              {m.role}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RolesMatrix() {
  return (
    <Section title="Roles & Permissions" desc="What each role can access.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <th className="py-2 pr-3 font-medium">Module</th>
              {ROLES.map((r) => (
                <th key={r} className="px-2 py-2 text-center font-medium">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((a) => (
              <tr key={a.action} className="border-t border-border">
                <td className="py-2 pr-3">{a.label}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-2 py-2 text-center">
                    {can(r, a.action) ? (
                      <Check className="mx-auto h-4 w-4 text-success" />
                    ) : (
                      <span className="text-fg-muted">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
