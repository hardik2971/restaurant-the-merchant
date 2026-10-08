// Floor plan / table-session view types (Table Management & POS — Phase 1).

export type TableState =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'WAITING_PAYMENT'
  | 'CLEANING'
  | 'OUT_OF_SERVICE';

export interface FloorSession {
  id: string;
  openedAt: string;
  customerCount: number;
  customerName?: string;
  waiterName?: string;
  currentBill: number;
  orderCount: number;
}

export interface FloorTable {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
  state: TableState;
  session: FloorSession | null;
}

export const TABLE_STATES: TableState[] = [
  'AVAILABLE',
  'RESERVED',
  'OCCUPIED',
  'WAITING_PAYMENT',
  'CLEANING',
  'OUT_OF_SERVICE',
];

// Colors follow the spec (green/red/yellow/orange/blue/grey).
export const STATE_UI: Record<TableState, { label: string; card: string; badge: string }> = {
  AVAILABLE: { label: 'Available', card: 'border-success/40 bg-success-soft/50', badge: 'bg-success-soft text-success' },
  RESERVED: { label: 'Reserved', card: 'border-warn/40 bg-warn-soft/50', badge: 'bg-warn-soft text-warn' },
  OCCUPIED: { label: 'Occupied', card: 'border-danger/40 bg-danger-soft/50', badge: 'bg-danger-soft text-danger' },
  WAITING_PAYMENT: { label: 'Waiting Payment', card: 'border-accent/50 bg-accent-soft/60', badge: 'bg-accent-soft text-accent' },
  CLEANING: { label: 'Cleaning', card: 'border-info/40 bg-info-soft', badge: 'bg-info-soft text-info' },
  OUT_OF_SERVICE: { label: 'Out of Service', card: 'border-border bg-bg', badge: 'bg-bg text-fg-muted' },
};

export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Wallet', 'Mixed'] as const;

// ---- POS (Phase 2/3) ----
export interface PosLine {
  menuItemId: string;
  name: string;
  qty: number;
  price: number;
}

export interface PosOrder {
  id: string;
  number: string;
  createdAt: string;
  items: { name: string; qty: number; price: number }[];
}

export interface PosPayment {
  amount: number;
  method: string;
  createdAt: string;
}

export interface PosSession {
  id: string;
  openedAt: string;
  customerCount: number;
  customerName?: string;
  waiterName?: string;
  lines: PosLine[]; // aggregated across all session orders
  orders: PosOrder[]; // per-order, for KOT
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  tip: number;
  total: number;
  payments: PosPayment[];
  paid: number;
  remaining: number;
}

export interface MergeTarget {
  tableId: string;
  sessionId: string;
  number: string;
}

export interface PosTable {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  state: TableState;
}

export interface PosData {
  table: PosTable | null;
  session: PosSession | null;
}
