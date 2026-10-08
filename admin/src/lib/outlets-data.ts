// Mock outlets + weekly operational metrics. Single source for both the Outlets
// module and the dashboard "Cost vs Revenue" chart. Phase 7 (DB live) replaces
// this with Prisma queries over the Outlet / OutletMetric models.

export interface WeeklyMetric {
  week: string;
  revenue: number;
  cost: number;
}

export interface Outlet {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  manager: string;
  isActive: boolean;
  weekly: WeeklyMetric[];
}

// Current-week revenue/cost per outlet (drives the dashboard line chart).
const BASE: Array<Omit<Outlet, 'weekly'> & { revenue: number; cost: number }> = [
  { id: 'ot1', name: 'Outlet 01', location: 'Beacon Hill', address: '12 Charles St, Boston', phone: '+1 617 555 0101', manager: 'Daniel Cole', isActive: true, revenue: 7200, cost: 5400 },
  { id: 'ot2', name: 'Outlet 02', location: 'North End', address: '88 Hanover St, Boston', phone: '+1 617 555 0102', manager: 'Priya Shah', isActive: true, revenue: 9100, cost: 8200 },
  { id: 'ot3', name: 'Outlet 03', location: 'Back Bay', address: '255 Newbury St, Boston', phone: '+1 617 555 0103', manager: 'Marco Rossi', isActive: true, revenue: 8300, cost: 11600 },
  { id: 'ot4', name: 'Outlet 04', location: 'Seaport', address: '60 Seaport Blvd, Boston', phone: '+1 617 555 0104', manager: 'Hannah Lee', isActive: true, revenue: 9800, cost: 8700 },
  { id: 'ot5', name: 'Outlet 05', location: 'Downtown Crossing', address: '40 Summer St, Boston', phone: '+1 617 555 0105', manager: 'George Daniel', isActive: true, revenue: 10500, cost: 14000 },
  { id: 'ot6', name: 'Outlet 06', location: 'Fenway', address: '1 Lansdowne St, Boston', phone: '+1 617 555 0106', manager: 'Owen Pierce', isActive: true, revenue: 11200, cost: 9300 },
  { id: 'ot7', name: 'Outlet 07', location: 'Cambridge', address: '5 Kendall Sq, Cambridge', phone: '+1 617 555 0107', manager: 'Sara Kim', isActive: false, revenue: 9600, cost: 12400 },
  { id: 'ot8', name: 'Outlet 08', location: 'Brookline', address: '210 Harvard St, Brookline', phone: '+1 617 555 0108', manager: 'Tom Walsh', isActive: true, revenue: 12100, cost: 10200 },
];

// Deterministic 4-week history ending at the current values (stable across SSR).
const WEEK_FACTORS = [0.82, 0.9, 0.96, 1.0];

export const OUTLETS: Outlet[] = BASE.map((o) => ({
  id: o.id,
  name: o.name,
  location: o.location,
  address: o.address,
  phone: o.phone,
  manager: o.manager,
  isActive: o.isActive,
  weekly: WEEK_FACTORS.map((f, i) => ({
    week: `W${i + 1}`,
    revenue: Math.round(o.revenue * f),
    cost: Math.round(o.cost * f),
  })),
}));

export function current(o: Outlet): WeeklyMetric {
  return o.weekly[o.weekly.length - 1];
}

export function margin(o: Outlet): number {
  const c = current(o);
  if (c.revenue === 0) return 0;
  return Math.round(((c.revenue - c.cost) / c.revenue) * 100);
}

// Series consumed by the dashboard "Outlets Operational Cost Vs Revenue" chart.
export const OUTLET_SERIES = OUTLETS.map((o) => ({
  outlet: o.name,
  sells: current(o).revenue,
  cost: current(o).cost,
}));

export const OUTLET_ACTIVE = 'Outlet 05';
