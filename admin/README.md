# Restaurant Admin

Management & POS dashboard for **The Merchant Boston** — companion to the public
site in [`../website`](../website). Built with **Next.js 16 (App Router)** ·
**React 19** · **Tailwind CSS v4** · **TypeScript** · **Prisma 6 / MySQL** ·
**Auth.js (NextAuth v5)**.

> See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the full phase-by-phase plan.

## Features

- **Auth & RBAC** — credentials login (bcrypt + JWT sessions), three roles
  (Owner / Manager / Staff) enforced in both the nav and server-side route guards.
- **Dashboard** — live KPIs, outlet cost-vs-revenue, category mix, employee gauge,
  POS activity, recent orders, sales-type split (the attached design mockup).
- **Modules** — Menu, Orders & POS, Reservations (table + private events),
  Outlets, Staff, Customers, Inventory (low-stock alerts), Reports (CSV export),
  Settings, Notifications. All read live from MySQL; writes persist via server actions.

## Prerequisites

- Node 20+
- A MySQL 8 database. In this project it is **remote, reached over an SSH tunnel**:

  ```bash
  # Open the tunnel in a separate terminal and leave it running:
  ssh -N -L 33663:127.0.0.1:3306 root@<server>
  ```

  Then `DATABASE_URL` points at the local end (`127.0.0.1:33663`).

## Setup

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL + AUTH_SECRET
npx prisma generate
npm run db:push               # create tables (needs DB reachable)
npm run db:seed               # seed demo data + 3 logins
```

### Seeded logins (password `admin123`)

| Email | Role |
|-------|------|
| `george@merchant.test` | Owner |
| `manager@merchant.test` | Manager |
| `staff@merchant.test` | Staff |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on **:3001** (slow on network/HDD drives — prefer build+start) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run db:push` / `db:seed` / `db:studio` | Prisma DB tasks |

## Environment variables

```
DATABASE_URL="mysql://user:pass@127.0.0.1:33663/restaurant_db"  # URL-encode @ as %40
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3001
# SMTP_* for future reservation/login emails
```

## Deployment

1. Provision **managed MySQL 8** (PlanetScale / RDS / Railway) and set `DATABASE_URL`.
2. `npx prisma migrate deploy` (or `db push`) to create the schema; seed if desired.
3. `npm run build` then `npm start` (or deploy to Vercel / a Docker image).
4. Set `AUTH_SECRET`, `NEXTAUTH_URL`, and `AUTH_TRUST_HOST=true` in the host env.

CI (`.github/workflows/ci.yml`) runs typecheck → tests → build on every push/PR.

## Notes

- **Prisma is pinned to v6** (v7 requires a `prisma.config.ts` + driver adapters).
- `prisma generate` fails with an `EPERM` DLL-rename if a dev/prod server is running —
  stop Node first.
- If MySQL is unreachable, pages fall back to seed data so the UI still renders.
