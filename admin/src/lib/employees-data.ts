// 120 employees, generated deterministically (stable across SSR/CSR — no random).
// Status counts are fixed to match the dashboard gauge: On Duty 83 / On Break 10
// / Absent 07 / Off 20. Phase 8 (DB live) replaces this with Prisma queries over
// the Employee model.

export type DutyStatus = 'ON_DUTY' | 'ON_BREAK' | 'ABSENT' | 'OFF';

export interface Employee {
  id: string;
  name: string;
  role: string;
  outlet: string;
  email: string;
  phone?: string;
  active: boolean;
  status: DutyStatus;
  createdAt?: string;
}

export const ROLES = [
  'Server',
  'Line Cook',
  'Chef',
  'Bartender',
  'Host',
  'Sous Chef',
  'Dishwasher',
  'Manager',
] as const;

const FIRST = [
  'Olivia', 'Liam', 'Noah', 'Emma', 'Ava', 'James', 'Sophia', 'Lucas', 'Mia', 'Benjamin',
  'Isabella', 'William', 'Amelia', 'Henry', 'Ella', 'Jack', 'Grace', 'Leo', 'Chloe', 'Owen',
  'Lily', 'Mason', 'Zoe', 'Ethan',
];
const LAST = [
  'Bennett', 'Carter', 'Patel', 'Wilson', 'Nguyen', 'Murphy', 'Thompson', 'Reed', 'Cruz', 'Scott',
  'Foster', 'Gray', 'Shah', 'Rossi', 'Lee', 'Pierce', 'Kim', 'Walsh', 'Hughes', 'Diaz',
  'Brooks', 'Ortiz', 'Bailey', 'Cole',
];

// Status by index range → exact counts (83 / 10 / 7 / 20 = 120).
function statusForIndex(i: number): DutyStatus {
  if (i < 83) return 'ON_DUTY';
  if (i < 93) return 'ON_BREAK';
  if (i < 100) return 'ABSENT';
  return 'OFF';
}

const generated: Employee[] = Array.from({ length: 120 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  const name = `${first} ${last}`;
  return {
    id: `e${i + 1}`,
    name,
    role: ROLES[i % ROLES.length],
    outlet: `Outlet 0${(i % 8) + 1}`,
    email: `${first}.${last}`.toLowerCase() + '@merchant.test',
    active: true,
    status: statusForIndex(i),
  };
});

// Sort by name so the directory shows a natural mix of statuses.
export const EMPLOYEES: Employee[] = generated.sort((a, b) => a.name.localeCompare(b.name));

export const STATUS_LABELS: Record<DutyStatus, string> = {
  ON_DUTY: 'On Duty',
  ON_BREAK: 'On Break',
  ABSENT: 'Absent',
  OFF: 'Off Shift',
};

export function statusCounts(list: Employee[] = EMPLOYEES) {
  return list.reduce(
    (acc, e) => {
      acc[e.status] += 1;
      return acc;
    },
    { ON_DUTY: 0, ON_BREAK: 0, ABSENT: 0, OFF: 0 } as Record<DutyStatus, number>,
  );
}
