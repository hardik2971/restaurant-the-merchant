import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { UserMenu } from '@/components/layout/UserMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

interface TopbarUser {
  name: string;
  role: string;
  image?: string | null;
}

export function Topbar({
  title,
  subtitle,
  user,
  notificationCount,
}: {
  title: string;
  subtitle: string;
  user: TopbarUser;
  notificationCount: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-bg/80 px-6 py-4 backdrop-blur">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold leading-tight">{title}</h1>
        <p className="truncate text-sm text-fg-muted">{subtitle}</p>
      </div>

      {/* Global search */}
      <div className="relative mx-auto hidden w-full max-w-xl md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
        <input
          placeholder="type here to search anything"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-11 pr-16 text-sm outline-none transition-colors focus:border-accent"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-bg px-1.5 py-0.5 text-[11px] font-medium text-fg-muted">
          ⌘F
        </kbd>
      </div>

      {/* Theme + Notifications + User */}
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
