import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/floor-stream — Server-Sent Events for the live floor plan. Emits a
// "refresh" event only when table/session/order data actually changes (detected
// via max updatedAt), so clients re-fetch on real changes instead of polling.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const encoder = new TextEncoder();

  const computeVersion = async () => {
    const [t, s, o] = await Promise.all([
      prisma.table.aggregate({ _max: { updatedAt: true } }),
      prisma.tableSession.aggregate({ _max: { updatedAt: true } }),
      prisma.order.aggregate({ _max: { updatedAt: true } }),
    ]);
    return `${t._max.updatedAt?.getTime() ?? 0}-${s._max.updatedAt?.getTime() ?? 0}-${o._max.updatedAt?.getTime() ?? 0}`;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          /* closed */
        }
      };
      send('connected');
      let last = await computeVersion().catch(() => '');

      const interval = setInterval(async () => {
        try {
          const v = await computeVersion();
          if (v !== last) {
            last = v;
            send('refresh');
          } else {
            controller.enqueue(encoder.encode(`: ping\n\n`)); // keep-alive comment
          }
        } catch {
          /* ignore transient DB errors */
        }
      }, 4000);

      const close = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
