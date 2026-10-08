import { ShoppingBag, CalendarClock, PackageX, LayoutDashboard } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNotifications, type Notification } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

const META: Record<Notification['type'], { icon: React.ElementType; cls: string }> = {
  order: { icon: ShoppingBag, cls: 'bg-info-soft text-info' },
  reservation: { icon: CalendarClock, cls: 'bg-accent-soft text-accent' },
  stock: { icon: PackageX, cls: 'bg-danger-soft text-danger' },
  table: { icon: LayoutDashboard, cls: 'bg-warn-soft text-warn' },
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const notifications = await getNotifications().catch(() => [] as Notification[]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card divide-y divide-border">
        {notifications.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-fg-muted">You&rsquo;re all caught up.</p>
        )}
        {notifications.map((n) => {
          const meta = META[n.type];
          return (
            <div key={n.id} className="flex items-start gap-3 px-5 py-4">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.cls}`}>
                <meta.icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-fg-muted">{n.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-fg-muted">{formatDate(n.time, 'MMM d, h:mm a')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
