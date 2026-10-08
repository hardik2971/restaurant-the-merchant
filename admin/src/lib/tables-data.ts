// Restaurant tables for table-wise QR ordering (TASK 5). Phase/DB-live replaces
// this with Prisma queries; shapes mirror the Table model in schema.prisma.

export type TableStatus = 'ACTIVE' | 'INACTIVE';

export interface RestaurantTable {
  id: string;
  number: string;
  name?: string;
  code: string; // QR token used in the order URL
  status: TableStatus;
  orderCount: number;
  createdAt?: string;
}

export const TABLES: RestaurantTable[] = [
  { id: 't1', number: '1', name: 'Window', code: 'demo-table-1', status: 'ACTIVE', orderCount: 0 },
  { id: 't2', number: '2', name: 'Window', code: 'demo-table-2', status: 'ACTIVE', orderCount: 0 },
  { id: 't3', number: '3', name: 'Booth', code: 'demo-table-3', status: 'ACTIVE', orderCount: 0 },
  { id: 't4', number: '4', name: 'Booth', code: 'demo-table-4', status: 'INACTIVE', orderCount: 0 },
  { id: 't5', number: '5', name: 'Patio', code: 'demo-table-5', status: 'ACTIVE', orderCount: 0 },
  { id: 't6', number: '6', name: 'Bar', code: 'demo-table-6', status: 'ACTIVE', orderCount: 0 },
];

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};
