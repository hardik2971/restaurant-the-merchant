import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('1) DB connectivity:');
    const r = await prisma.$queryRawUnsafe('SELECT 1 AS ok');
    console.log('   OK', r);

    console.log('2) Counts:');
    console.log('   menuItems =', await prisma.menuItem.count());
    console.log('   outlets   =', await prisma.outlet.count());
    console.log('   orders    =', await prisma.order.count());

    console.log('3) Charred Octopus lookup:');
    const mi = await prisma.menuItem.findFirst({ where: { name: 'Charred Octopus' } });
    console.log('   ', mi ? `found id=${mi.id} available=${mi.available} price=${mi.price}` : 'NOT FOUND');

    console.log('4) Attempt minimal order.create (rolled back):');
    const outlet = await prisma.outlet.findFirst({ select: { id: true } });
    const outletId = outlet?.id ?? 'online';
    console.log('   using outletId =', outletId);
    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: 'diag@example.com' },
        update: { name: 'Diag', phone: '123' },
        create: { name: 'Diag', email: 'diag@example.com', phone: '123' },
      });
      const order = await tx.order.create({
        data: {
          number: `DIAG-${Math.floor(Math.random() * 99999)}`,
          type: 'PICKUP',
          status: 'PENDING',
          channel: 'ONLINE',
          paymentMethod: 'ONLINE',
          total: 29,
          outletId,
          customerName: 'Diag',
          customerEmail: 'diag@example.com',
          customerPhone: '123',
          customerId: customer.id,
          scheduleType: 'NOW',
          notes: 'diag',
          items: mi
            ? { create: [{ menuItemId: mi.id, name: mi.name, qty: 1, price: mi.price }] }
            : undefined,
        },
      });
      console.log('   order.create OK id=', order.id);
      throw new Error('__ROLLBACK__');
    }).catch((e) => {
      if (e.message === '__ROLLBACK__') console.log('   (rolled back test order)');
      else throw e;
    });

    console.log('\nRESULT: order.create path works — the live failure is elsewhere.');
  } catch (e) {
    console.error('\n>>> REAL ERROR <<<');
    console.error('name:', e?.name);
    console.error('code:', e?.code);
    console.error('message:', e?.message);
    if (e?.meta) console.error('meta:', e.meta);
  } finally {
    await prisma.$disconnect();
  }
}
main();
