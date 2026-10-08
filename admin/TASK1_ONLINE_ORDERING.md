# TASK 1 — Online Ordering Flow (implementation notes)

Customer-facing online ordering on the **website** that syncs into the **admin**
panel. Two paths from one entry point (`/order`):

- **Take Away** — browse the live menu → cart → **Schedule Now** (ASAP, est.
  pickup) or **Schedule Later** (date + 30-min slot, business-hours + cutoff
  validated) → contact details → order is created in the admin DB (channel =
  `ONLINE`, type = `PICKUP`).
- **Dine-In** — pick a date → **live** 30-min slots (full slots disabled, no
  double-booking) → party size + notes → contact → a `TABLE` reservation is
  created and appears in admin **Reservations**.

## Architecture

```
Browser ── same-origin ──► website /api/{orders,reservations,availability}
                               │  (server-side proxy, no CORS)
                               ▼
                          admin /api/{orders,reservations,*}  ── Prisma ──► MySQL
                               ▲
website /order (server) ───────┘  fetches live menu from admin /api/menu
```

`ADMIN_API_URL` (website env, server-only) points at the admin app. Defaults to
`http://127.0.0.1:20134`.

## Files

**Admin**
- `prisma/schema.prisma` — `Order` gains `channel` (`OrderChannel`),
  `scheduleType`/`scheduleDate`/`scheduleTime` (`ScheduleType`), `notes`,
  `customerEmail`, `customerPhone`; new enums `OrderChannel`, `ScheduleType`.
- `src/lib/scheduling.ts` — business hours, 30-min slots, cutoff, pickup estimate,
  slot capacity (authoritative).
- `src/schemas/order.ts` — Zod intake for online orders.
- `src/app/api/orders/route.ts` — `POST` online order (prices from live menu,
  customer upsert, pickup estimate).
- `src/app/api/menu/route.ts` — `GET` public menu feed (available items only).
- `src/app/api/reservations/route.ts` — `POST` now validates the slot, blocks
  double-booking, and upserts the customer.
- `src/app/api/reservations/availability/route.ts` — `GET ?date=` slot openings.
- Orders/Reservations admin UI — online badge + channel filter, schedule/notes in
  order detail; reservation **date filter**, **edit**, and "Checked In" status
  label.

**Website**
- `lib/order.ts`, `lib/admin-api.ts` — config/types + admin base URL.
- `app/api/{orders,reservations,availability}/route.ts` — proxies to admin.
- `app/order/page.tsx` + `components/order/*` — the full ordering flow.
- `components/Header.tsx` — "Order Online" now links to `/order`.

## Apply it (run these — DB lives behind the SSH tunnel)

> The admin MySQL is remote; bring the tunnel up first (local `127.0.0.1:3306`).
> Stop the admin `node`/dev server before `prisma generate` (Windows file lock).

```bash
# 1) admin: regenerate client + push the new columns
cd f:/DI_Local_Project/restaurant/admin
npx prisma generate
npx prisma db push          # or: npx prisma migrate dev -n online_ordering

# 2) (optional) reseed — existing seed works unchanged; new fields use defaults
npm run db:seed

# 3) typecheck should now be clean
npx tsc --noEmit

# 4) run both apps
npm run build && npm run start         # admin on :20134
cd ../website && npm run dev            # website on :3000 (start → :20133)
```

Set `ADMIN_API_URL` in `website/.env.local` if the admin runs anywhere other than
`http://127.0.0.1:20134`.

## Verify

1. Website → **Order Online** → **Take Away** → add items → **Schedule Later** →
   pick a date/slot → submit → note the `ORD-…` number.
2. Admin → **Orders** → the order shows with an **Online** badge, channel filter,
   and schedule/notes in its detail.
3. Website → **Dine-In** → a date with bookings shows fewer open slots; submit →
   admin **Reservations** shows it as **Pending**, filterable by date, editable,
   and movable through Confirmed → Checked In → Completed.
