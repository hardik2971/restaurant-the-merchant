'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  ClipboardList,
  ShoppingCart,
  CalendarCheck,
  LayoutDashboard,
  QrCode,
  Store,
  Users,
  Contact,
  Gift,
  CreditCard,
  Package,
  BarChart3,
  Activity,
  ScrollText,
} from 'lucide-react';
import type { Role } from '@prisma/client';
import { can, type Action } from '@/lib/rbac';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  action?: Action;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutGrid,
    action: "view:dashboard",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: ShoppingCart,
    action: "manage:orders",
  },
  { href: "/menu", label: "Menu", icon: ClipboardList, action: "manage:menu" },
  {
    href: "/reservations",
    label: "Reservations",
    icon: CalendarCheck,
    action: "manage:reservations",
  },
  { href: "/tables", label: "Tables", icon: QrCode, action: "manage:tables" },
  {
    href: "/floor",
    label: "Floor",
    icon: LayoutDashboard,
    action: "manage:tables",
  },
  {
    href: "/table-analytics",
    label: "Table Analytics",
    icon: Activity,
    action: "view:reports",
  },
  { href: "/staff", label: "Staff", icon: Users, action: "manage:staff" },
  {
    href: "/customers",
    label: "Customers",
    icon: Contact,
    action: "manage:customers",
  },
  {
    href: "/gift-cards",
    label: "Gift Cards",
    icon: Gift,
    action: "manage:coupons",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: CreditCard,
    action: "view:reports",
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Package,
    action: "manage:inventory",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    action: "view:reports",
  },
  // { href: '/outlets', label: 'Outlets', icon: Store, action: 'manage:outlets' },
];

const BOTTOM: NavItem[] = [
  { href: '/audit', label: 'Audit Log', icon: ScrollText, action: 'manage:settings' },
];

function NavIcon({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-xl transition-colors',
        active
          ? 'bg-accent text-white shadow-card'
          : 'text-fg-muted hover:bg-accent-soft hover:text-accent',
      )}
    >
      <Icon className="h-5 w-5" />
    </Link>
  );
}

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const visible = (item: NavItem) => !item.action || can(role, item.action);
  const nav = NAV.filter(visible);
  const bottom = BOTTOM.filter(visible);

  return (
    <aside className="sticky top-0 flex h-screen w-[72px] shrink-0 flex-col items-center border-r border-border bg-surface py-5">
      <Link
        href="/dashboard"
        aria-label="The Merchant Boston"
        className="grid h-16 w-16 place-items-center"
      >
        <Image
          src="/images/logo_merchant.png"
          alt="The Merchant Boston"
          width={120}
          height={67}
          className="h-auto w-full object-contain invert"
        />
      </Link>

      <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
        {nav.map((n) => (
          <NavIcon key={n.href} {...n} active={isActive(n.href)} />
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2">
        {bottom.map((n) => (
          <NavIcon key={n.href} {...n} active={isActive(n.href)} />
        ))}
      </div>
    </aside>
  );
}
