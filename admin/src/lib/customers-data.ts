// Customers are derived (aggregated) from orders + reservations — exactly how
// the CRM works once the DB is live: an order/reservation links to a Customer
// by email/name. Phase 9 (DB live) replaces this with a Prisma query.
import { ORDERS, type OrderStatus } from '@/lib/orders-data';
import { RESERVATIONS, type ReservationKind, type ReservationStatus } from '@/lib/reservations-data';

export interface CustomerOrder {
  number: string;
  total: number;
  status: OrderStatus;
  date: string;
}

export interface CustomerReservation {
  reference: string;
  kind: ReservationKind;
  status: ReservationStatus;
  date: string;
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: CustomerStatus;
  orders: CustomerOrder[];
  reservations: CustomerReservation[];
  totalSpend: number;
  lastActivity: string;
  createdAt?: string;
}

function emailFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '.') + '@email.com';
}

function build(): Customer[] {
  const map = new Map<string, Customer>();

  const get = (name: string): Customer => {
    const key = name.toLowerCase();
    let c = map.get(key);
    if (!c) {
      c = {
        id: `c${map.size + 1}`,
        name,
        email: emailFromName(name),
        status: 'ACTIVE',
        orders: [],
        reservations: [],
        totalSpend: 0,
        lastActivity: '',
      };
      map.set(key, c);
    }
    return c;
  };

  for (const o of ORDERS) {
    const c = get(o.customer);
    c.orders.push({ number: o.number, total: o.total, status: o.status, date: o.createdAt });
    if (o.status !== 'CANCELED') c.totalSpend += o.total;
    if (o.createdAt > c.lastActivity) c.lastActivity = o.createdAt;
  }

  for (const r of RESERVATIONS) {
    const c = get(r.name);
    // Reservations carry real contact details — prefer them.
    c.email = r.email;
    c.phone = r.phone;
    c.reservations.push({ reference: r.reference, kind: r.kind, status: r.status, date: r.date });
    if (r.createdAt > c.lastActivity) c.lastActivity = r.createdAt;
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const CUSTOMERS: Customer[] = build();

export function visits(c: Customer): number {
  return c.orders.length + c.reservations.length;
}
