// Mock reservations for the admin — modeled as if submitted from the public
// site's ReservationFlow. Phase 6 (DB live) replaces this with Prisma queries
// fed by the website POST. Shapes mirror the Reservation model in schema.prisma.

export type ReservationKind = 'TABLE' | 'PRIVATE_EVENT';
export type ReservationStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

export interface Reservation {
  id: string;
  reference: string;
  kind: ReservationKind;
  status: ReservationStatus;
  date: string; // ISO date
  name: string;
  email: string;
  phone: string;
  // table
  time?: string;
  guests?: number;
  occasion?: string;
  requests?: string;
  // private event
  eventType?: string;
  guestRange?: string;
  space?: string;
  company?: string;
  message?: string;
  createdAt: string;
}

export const RESERVATIONS: Reservation[] = [
  { id: 'r1', reference: 'SV-204815', kind: 'TABLE', status: 'REQUESTED', date: '2026-06-27', time: '19:00', guests: 4, name: 'Olivia Bennett', email: 'olivia@email.com', phone: '+1 617 555 0142', occasion: 'Anniversary', requests: 'Quiet corner table if possible.', createdAt: '2026-06-25T11:20:00' },
  { id: 'r2', reference: 'SV-204790', kind: 'TABLE', status: 'CONFIRMED', date: '2026-06-26', time: '18:30', guests: 2, name: 'Liam Carter', email: 'liam@email.com', phone: '+1 617 555 0199', occasion: 'Date Night', createdAt: '2026-06-25T10:05:00' },
  { id: 'r3', reference: 'SV-204772', kind: 'TABLE', status: 'SEATED', date: '2026-06-25', time: '20:00', guests: 6, name: 'Noah Patel', email: 'noah@email.com', phone: '+1 617 555 0173', occasion: 'Birthday', requests: 'Bringing a cake.', createdAt: '2026-06-24T16:40:00' },
  { id: 'r4', reference: 'SV-204760', kind: 'TABLE', status: 'COMPLETED', date: '2026-06-24', time: '19:30', guests: 2, name: 'Emma Wilson', email: 'emma@email.com', phone: '+1 617 555 0110', occasion: 'Casual Dining', createdAt: '2026-06-23T09:15:00' },
  { id: 'r5', reference: 'SV-204745', kind: 'TABLE', status: 'CANCELED', date: '2026-06-25', time: '17:30', guests: 3, name: 'Sophia Nguyen', email: 'sophia@email.com', phone: '+1 617 555 0166', occasion: 'Business', createdAt: '2026-06-23T14:30:00' },
  { id: 'r6', reference: 'EV-100231', kind: 'PRIVATE_EVENT', status: 'REQUESTED', date: '2026-07-12', guestRange: '40–70', space: 'Private Room', eventType: 'Corporate Dinner', company: 'Northwind Co.', name: 'James Murphy', email: 'james@northwind.co', phone: '+1 617 555 0188', message: 'Year-end team dinner, plated menu preferred.', createdAt: '2026-06-25T09:50:00' },
  { id: 'r7', reference: 'EV-100225', kind: 'PRIVATE_EVENT', status: 'CONFIRMED', date: '2026-07-04', guestRange: '70–120', space: 'Full Buyout', eventType: 'Wedding / Engagement', name: 'Ava Thompson', email: 'ava@email.com', phone: '+1 617 555 0124', message: 'Engagement party, evening reception.', createdAt: '2026-06-22T13:10:00' },
  { id: 'r8', reference: 'EV-100210', kind: 'PRIVATE_EVENT', status: 'COMPLETED', date: '2026-06-20', guestRange: '20–40', space: 'Main Dining', eventType: 'Birthday', name: 'Benjamin Scott', email: 'ben@email.com', phone: '+1 617 555 0155', createdAt: '2026-06-10T15:00:00' },
  { id: 'r9', reference: 'EV-100240', kind: 'PRIVATE_EVENT', status: 'REQUESTED', date: '2026-07-20', guestRange: '10–20', space: 'Bar Area', eventType: 'Cocktail Party', company: 'Lumen Studio', name: 'Mia Foster', email: 'mia@lumen.studio', phone: '+1 617 555 0137', createdAt: '2026-06-25T08:30:00' },
  { id: 'r10', reference: 'SV-204700', kind: 'TABLE', status: 'NO_SHOW', date: '2026-06-23', time: '18:00', guests: 2, name: 'Lucas Gray', email: 'lucas@email.com', phone: '+1 617 555 0101', occasion: 'Casual Dining', createdAt: '2026-06-22T19:00:00' },
];

export const KIND_LABELS: Record<ReservationKind, string> = {
  TABLE: 'Table Booking',
  PRIVATE_EVENT: 'Private Event',
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  REQUESTED: 'Pending',
  CONFIRMED: 'Confirmed',
  SEATED: 'Checked In',
  COMPLETED: 'Completed',
  CANCELED: 'Cancelled',
  NO_SHOW: 'No-show',
};

/** Status workflow — differs slightly for table vs private event. */
export function nextStatuses(kind: ReservationKind, status: ReservationStatus): ReservationStatus[] {
  const flow: ReservationStatus[] =
    kind === 'TABLE'
      ? ['REQUESTED', 'CONFIRMED', 'SEATED', 'COMPLETED']
      : ['REQUESTED', 'CONFIRMED', 'COMPLETED'];

  if (status === 'COMPLETED' || status === 'CANCELED' || status === 'NO_SHOW') return [];

  const idx = flow.indexOf(status);
  const forward = idx >= 0 && idx < flow.length - 1 ? [flow[idx + 1]] : [];
  const extras: ReservationStatus[] = kind === 'TABLE' ? ['CANCELED', 'NO_SHOW'] : ['CANCELED'];
  return [...forward, ...extras];
}
