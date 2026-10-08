import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { ShellTopbar } from '@/components/layout/ShellTopbar';
import { getAttentionCount } from '@/lib/queries';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = {
    name: session.user.name ?? 'User',
    role: ROLE_LABELS[session.user.role] ?? session.user.role,
    image: session.user.image,
  };

  const notificationCount = await getAttentionCount().catch(() => 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellTopbar user={user} notificationCount={notificationCount} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
