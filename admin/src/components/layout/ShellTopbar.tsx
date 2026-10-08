'use client';

import { usePathname } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';

interface ShellUser {
  name: string;
  role: string;
  image?: string | null;
}

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Overview', subtitle: 'Manage your restaurant & team members from here.' },
  '/orders': { title: 'Orders', subtitle: 'Track and manage every order across outlets.' },
  '/menu': { title: 'Menu', subtitle: 'Manage dishes, categories, and availability.' },
  '/reservations': {
    title: 'Reservations',
    subtitle: 'Table bookings & private events from your guests.',
  },
  '/floor': { title: 'Floor Plan', subtitle: 'Live table status, sessions & occupancy.' },
  '/pos': { title: 'Point of Sale', subtitle: 'Table billing, order entry & checkout.' },
  '/tables': { title: 'Table Management', subtitle: 'QR codes for table-side ordering.' },
  '/outlets': { title: 'Outlets', subtitle: 'Locations, managers, and operational metrics.' },
  '/staff': { title: 'Staff', subtitle: 'Your team directory and duty status.' },
  '/customers': { title: 'Customers', subtitle: 'Guest profiles, history, and lifetime value.' },
  '/gift-cards': {
    title: 'Gift Card & Coupon Management',
    subtitle: 'Purchases, codes, and coupon status.',
  },
  '/transactions': { title: 'Transactions', subtitle: 'Payments across orders, gift cards & tables.' },
  '/inventory': { title: 'Inventory', subtitle: 'Stock levels and low-stock alerts.' },
  '/table-analytics': { title: 'Table Analytics', subtitle: 'Sessions, occupancy & table performance.' },
  '/table-history': { title: 'Table History', subtitle: 'Complete session timeline for a table.' },
  '/reports': { title: 'Reports', subtitle: 'Analytics and exportable insights.' },
  '/notifications': { title: 'Notifications', subtitle: 'Recent activity across the restaurant.' },
  '/audit': { title: 'Audit Log', subtitle: 'Every POS & table action, who and when.' },
  '/settings': { title: 'Settings', subtitle: 'Restaurant configuration and your profile.' },
};

export function ShellTopbar({
  user,
  notificationCount,
}: {
  user: ShellUser;
  notificationCount: number;
}) {
  const pathname = usePathname();
  const match =
    Object.entries(TITLES).find(([href]) =>
      href === '/dashboard' ? pathname === href : pathname.startsWith(href),
    )?.[1] ?? TITLES['/dashboard'];

  return (
    <Topbar
      title={match.title}
      subtitle={match.subtitle}
      user={user}
      notificationCount={notificationCount}
    />
  );
}
