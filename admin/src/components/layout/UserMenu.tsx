'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ChevronDown, Settings, LogOut } from 'lucide-react';

interface MenuUser {
  name: string;
  role: string;
  image?: string | null;
}

export function UserMenu({ user }: { user: MenuUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-xl px-1.5 py-1 transition-colors hover:bg-surface"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-accent-soft text-sm font-semibold text-accent">
          {user.image ? (
            <Image src={user.image} alt={user.name} fill sizes="40px" className="object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{user.name}</span>
          <span className="block text-xs text-fg-muted">{user.role}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-fg-muted sm:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-pop"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-fg-muted">{user.role}</p>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-bg"
            role="menuitem"
          >
            <Settings className="h-4 w-4 text-fg-muted" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger-soft"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
