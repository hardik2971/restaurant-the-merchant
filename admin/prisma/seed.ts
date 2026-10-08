import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MENU_ITEMS } from '../src/lib/menu-data';
import { OUTLETS, current } from '../src/lib/outlets-data';
import { EMPLOYEES } from '../src/lib/employees-data';
import { ORDERS } from '../src/lib/orders-data';
import { RESERVATIONS } from '../src/lib/reservations-data';
import { INVENTORY_ITEMS } from '../src/lib/inventory-data';

const prisma = new PrismaClient();

const emailFromName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '.') + '@email.com';

async function main() {
  // ---- Clean transactional/reference tables (FK-safe order). Users are kept. ----
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.outletMetric.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.inventoryItem.deleteMany();

  // ---- 1. Users (login accounts) ----
  const pwd = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'george@merchant.test' },
    update: { name: 'George Daniel', role: Role.OWNER },
    create: { name: 'George Daniel', email: 'george@merchant.test', password: pwd, role: Role.OWNER },
  });
  await prisma.user.upsert({
    where: { email: 'manager@merchant.test' },
    update: { role: Role.MANAGER },
    create: { name: 'Priya Shah', email: 'manager@merchant.test', password: pwd, role: Role.MANAGER },
  });
  await prisma.user.upsert({
    where: { email: 'staff@merchant.test' },
    update: { role: Role.STAFF },
    create: { name: 'Noah Patel', email: 'staff@merchant.test', password: pwd, role: Role.STAFF },
  });

  // ---- 2. Outlets + weekly metrics ----
  const outletIdByName = new Map<string, string>();
  for (let i = 0; i < OUTLETS.length; i++) {
    const o = OUTLETS[i];
    const created = await prisma.outlet.create({
      data: {
        name: o.name,
        location: o.location,
        address: o.address,
        phone: o.phone,
        manager: o.manager,
        isActive: o.isActive,
        metrics: {
          create: o.weekly.map((w, wi) => ({
            periodStart: new Date(2026, 5, 1 + wi * 7), // June 2026, weekly
            revenue: w.revenue,
            operationalCost: w.cost,
          })),
        },
      },
    });
    outletIdByName.set(o.name, created.id);
  }

  // ---- 3. Categories + Menu items ----
  const categoryNames = Array.from(new Set(MENU_ITEMS.map((m) => m.category)));
  const categoryIdByName = new Map<string, string>();
  for (const name of categoryNames) {
    const cat = await prisma.category.create({ data: { name } });
    categoryIdByName.set(name, cat.id);
  }

  const menuIdByName = new Map<string, string>();
  for (const m of MENU_ITEMS) {
    const item = await prisma.menuItem.create({
      data: {
        name: m.name,
        description: m.description,
        price: m.price,
        rating: m.rating,
        tag: m.tag,
        imageUrl: m.imageUrl,
        available: m.available,
        categoryId: categoryIdByName.get(m.category)!,
      },
    });
    menuIdByName.set(m.name, item.id);
  }

  // ---- 4. Employees ----
  await prisma.employee.createMany({
    data: EMPLOYEES.map((e) => ({
      name: e.name,
      role: e.role,
      email: e.email,
      status: e.status,
      outletId: outletIdByName.get(e.outlet) ?? e.outlet,
    })),
  });

  // ---- 5. Customers (aggregated from orders + reservations) ----
  const custInput = new Map<string, { name: string; email: string; phone?: string }>();
  for (const o of ORDERS) {
    if (!custInput.has(o.customer)) {
      custInput.set(o.customer, { name: o.customer, email: emailFromName(o.customer) });
    }
  }
  for (const r of RESERVATIONS) {
    custInput.set(r.name, { name: r.name, email: r.email, phone: r.phone });
  }
  const customerIdByName = new Map<string, string>();
  for (const c of custInput.values()) {
    const created = await prisma.customer.create({
      data: { name: c.name, email: c.email, phone: c.phone },
    });
    customerIdByName.set(c.name, created.id);
  }

  // ---- 6. Orders + items ----
  for (const o of ORDERS) {
    await prisma.order.create({
      data: {
        number: o.number,
        type: o.type,
        status: o.status,
        paymentMethod: o.paymentMethod,
        total: o.total,
        outletId: outletIdByName.get(o.outlet) ?? o.outlet,
        customerName: o.customer,
        customerId: customerIdByName.get(o.customer) ?? null,
        createdAt: new Date(o.createdAt),
        items: {
          create: o.items.map((it) => ({
            name: it.name,
            qty: it.qty,
            price: it.price,
            menuItemId: menuIdByName.get(it.name)!,
          })),
        },
      },
    });
  }

  // ---- 7. Reservations ----
  for (const r of RESERVATIONS) {
    await prisma.reservation.create({
      data: {
        reference: r.reference,
        kind: r.kind,
        status: r.status,
        date: new Date(r.date),
        name: r.name,
        email: r.email,
        phone: r.phone,
        time: r.time,
        guests: r.guests,
        occasion: r.occasion,
        requests: r.requests,
        eventType: r.eventType,
        guestRange: r.guestRange,
        space: r.space,
        company: r.company,
        message: r.message,
        customerId: customerIdByName.get(r.name) ?? null,
        createdAt: new Date(r.createdAt),
      },
    });
  }

  // ---- Restaurant profile (singleton) ----
  await prisma.restaurantProfile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'The Merchant Boston',
      currency: 'USD',
      timezone: 'America/New_York',
      address: '60 Franklin Street, Boston, MA 02110',
      phone: '+1 617 482 6060',
      email: 'hello@themerchantboston.com',
    },
  });

  // ---- 8. Inventory ----
  await prisma.inventoryItem.createMany({
    data: INVENTORY_ITEMS.map((it) => ({
      name: it.name,
      category: it.category,
      unit: it.unit,
      quantity: it.quantity,
      reorderLevel: it.reorderLevel,
      costPerUnit: it.costPerUnit,
      supplier: it.supplier,
    })),
  });

  // ---- Summary ----
  const [users, outlets, metrics, categories, menu, employees, customers, orders, items, reservations, inventory] =
    await Promise.all([
      prisma.user.count(),
      prisma.outlet.count(),
      prisma.outletMetric.count(),
      prisma.category.count(),
      prisma.menuItem.count(),
      prisma.employee.count(),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.reservation.count(),
      prisma.inventoryItem.count(),
    ]);

  console.log('Seed complete:');
  console.table({
    users,
    outlets,
    outletMetrics: metrics,
    categories,
    menuItems: menu,
    employees,
    customers,
    orders,
    orderItems: items,
    reservations,
    inventory,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
