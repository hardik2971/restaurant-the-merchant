import { KpiCard } from '@/components/dashboard/KpiCard';
import { TrendingItem } from '@/components/dashboard/TrendingItem';
import { OutletsChart } from '@/components/dashboard/OutletsChart';
import { TopCategories } from '@/components/dashboard/TopCategories';
import { EmployeeStatus } from '@/components/dashboard/EmployeeStatus';
import { PosActivities } from '@/components/dashboard/PosActivities';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { SalesOrderTypes } from '@/components/dashboard/SalesOrderTypes';
import {
  getDashboardData,
  getMenuItems,
  getMenuCategories,
  getDashboardConfig,
  type DashboardData,
} from '@/lib/queries';
import { auth } from '@/lib/auth';
import { can } from '@/lib/rbac';
import {
  KPIS,
  TRENDING,
  TOP_CATEGORIES,
  EMPLOYEE_STATUS,
  POS,
  RECENT_ORDERS,
  SALES_TYPES,
  OUTLET_REVENUE_TOTAL,
} from '@/lib/dashboard-data';
import { OUTLET_SERIES, OUTLET_ACTIVE } from '@/lib/outlets-data';

// Fallback used only if MySQL is unreachable, so the Overview still renders.
const MOCK: DashboardData = {
  kpis: KPIS,
  trending: TRENDING,
  outletSeries: OUTLET_SERIES,
  outletActive: OUTLET_ACTIVE,
  revenueTotal: OUTLET_REVENUE_TOTAL,
  topCategories: TOP_CATEGORIES,
  employee: { total: EMPLOYEE_STATUS.total, segments: EMPLOYEE_STATUS.segments },
  pos: POS,
  recentOrders: RECENT_ORDERS,
  salesTypes: SALES_TYPES,
};

export default async function DashboardPage() {
  const [data, menuItems, categories, cfg, session] = await Promise.all([
    getDashboardData().catch(() => MOCK),
    getMenuItems().catch(() => []),
    getMenuCategories().catch(() => []),
    getDashboardConfig().catch(() => ({ trendingItemId: null, topCategories: null })),
    auth(),
  ]);
  const editable = can(session?.user?.role ?? null, 'manage:menu');
  const menuOptions = menuItems.map((m) => ({ id: m.id, name: m.name }));
  const categoryOptions = categories.map((c) => c.name);

  return (
    <div className="flex flex-col gap-5 xl:flex-row">
      {/* ---- Left + middle column ---- */}
      <div className="min-w-0 flex-1 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <OutletsChart
              series={data.outletSeries}
              activeOutlet={data.outletActive}
              revenueTotal={data.revenueTotal}
            />
          </div>
          <div className="space-y-5 lg:col-span-5">
            <TopCategories
              categories={data.topCategories}
              categoryOptions={categoryOptions}
              editable={editable}
            />
            <EmployeeStatus total={data.employee.total} segments={data.employee.segments} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <RecentOrders orders={data.recentOrders} />
          </div>
          <div className="lg:col-span-5">
            <SalesOrderTypes types={data.salesTypes} />
          </div>
        </div>
      </div>

      {/* ---- Right column ---- */}
      <div className="w-full space-y-5 xl:w-[336px] xl:shrink-0">
        <TrendingItem
          trending={data.trending}
          menuOptions={menuOptions}
          currentItemId={cfg.trendingItemId}
          editable={editable}
        />
        <PosActivities pos={data.pos} />
      </div>
    </div>
  );
}
