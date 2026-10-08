# Restaurant Admin Panel — Development-Ready Implementation Plan

> **Product:** Admin / POS management dashboard for *The Merchant Boston* (a.k.a. Savora) restaurant
> **Companion to:** the existing public marketing site in [`/website`](../website)
> **Reference UI:** the attached "Overview" dashboard mockup (light theme, orange accent)
> **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript (strict)

This document is the single source of truth for building the admin panel. It is organized into
**sequential, independently-shippable phases**. Each phase lists scope, files to create, packages,
acceptance criteria, and how it maps to the dashboard mockup. Build phases in order; each one leaves
the app in a runnable, demoable state.

---

## 0. Decisions & Assumptions

These are the default decisions used throughout the plan. Change them here once if needed — the rest
of the plan references this section.

| # | Decision | Choice | Rationale / Alternative |
|---|----------|--------|-------------------------|
| D1 | Framework | **Next.js 16, App Router** | Matches `/website` (`next ^16.2.7`, React 19). |
| D2 | Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`) | Matches website; reuse the `@theme` token approach. |
| D3 | Language | **TypeScript strict** | Matches website `tsconfig`. |
| D4 | Data layer | **Next Route Handlers + Prisma 6 (pinned) + MySQL 8** | Self-contained; the empty `/api` folder can later host a dedicated service (NestJS/Express) — admin talks to it via the same typed client. **Note:** Prisma is pinned to v6 — Prisma 7 requires `prisma.config.ts` + driver adapters (heavier setup with rough Next.js edges). |
| D5 | Auth | **Auth.js (NextAuth v5) — Credentials + JWT sessions** | Email/password admin login with role-based access. |
| D6 | Server state | **TanStack Query v5** | Caching, mutations, optimistic updates for tables/forms. |
| D7 | UI state | **Zustand** | Sidebar collapse, theme, filters. Lightweight. |
| D8 | Charts | **Recharts** | Line (cost vs revenue), radial/gauge (payment, employee status), bars (sales types). |
| D9 | Tables | **TanStack Table v8** | Orders/menu/staff data grids, sorting, pagination. |
| D10 | Forms | **React Hook Form + Zod** | Shared Zod schemas validate both client and server. |
| D11 | Icons | **lucide-react** | Matches the line-icon style in the mockup. |
| D12 | Theme | **Light default** (matches mockup) **+ optional dark** | Reuse brand orange `#e14b2a` / gold `#e0a04b` as accent. |
| D13 | Port | **Admin dev on `:3001`**, website stays on `:3000` | Avoid collisions. |
| D14 | Seed data | **Reuse `website/lib/content.ts`** menu items as initial seed | One source of truth for menu data. |

**Open items to confirm with stakeholder (non-blocking — defaults chosen above):**
- Multi-outlet support (mockup shows "Outlet 01–08"). Plan assumes **multi-outlet from the start** (an `Outlet` entity), since the dashboard is built around it.
- Whether the public site's reservations should write to the same DB the admin reads (Phase 6 assumes **yes** — this is the integration payoff).

---

## 1. Target Information Architecture

Sidebar navigation (icons in the mockup, top-to-bottom) maps to these modules:

| Nav | Route | Module | Phase |
|-----|-------|--------|-------|
| ▦ Overview | `/dashboard` | Dashboard / KPIs | 3 |
| ▤ Orders | `/orders` | Orders + POS | 5 |
| 🛒 Menu | `/menu` | Menu & categories | 4 |
| 👥 Staff | `/staff` | Employees | 8 |
| 📦 Inventory | `/inventory` | Stock (optional) | 10 |
| 📊 Reports | `/reports` | Analytics | 11 |
| 🔔 Notifications | `/notifications` | Activity feed | 12 |
| ⚙ Settings | `/settings` | Config & profile | 12 |
| ⏏ Logout | — | Auth action | 1 |

Plus **Reservations** (`/reservations`, Phase 6), **Outlets** (`/outlets`, Phase 7), and
**Customers** (`/customers`, Phase 9).

---

## 2. Phase Roadmap (at a glance)

| Phase | Title | Outcome | Depends on |
|-------|-------|---------|------------|
| **P0** | Foundation & Tooling | Scaffolded app, design tokens, runs locally | — |
| **P1** | Auth & RBAC | Login, sessions, protected routes, roles | P0 |
| **P2** | App Shell & Navigation | Sidebar, topbar, search, responsive layout | P1 |
| **P3** | Dashboard / Overview | The attached mockup, fully built | P2 |
| **P4** | Menu Management | CRUD menu items + categories | P2 |
| **P5** | Orders & POS | Orders grid, detail, status, POS activity | P4 |
| **P6** | Reservations & Events | Manage bookings from the public site | P2 |
| **P7** | Outlets & Operations | Multi-outlet config, cost vs revenue data | P3 |
| **P8** | Staff / Employees | Employee directory, status, shifts | P2 |
| **P9** | Customers / CRM | Customer list, history | P5 |
| **P10** | Inventory (optional) | Stock items, low-stock alerts | P4 |
| **P11** | Reports & Analytics | Exportable reports, charts | P3, P5 |
| **P12** | Settings, Profile, Notifications | Restaurant config, roles, theme | P1 |
| **P13** | Hardening | a11y, perf, tests, CI, deploy | all |

---

## 3. Project Structure (target)

```
admin/
  package.json
  next.config.mjs
  postcss.config.mjs
  tsconfig.json
  .env.local                      # DATABASE_URL (MySQL), auth secret (gitignored)
  prisma/
    schema.prisma                 # datasource db { provider = "mysql" }
    seed.ts                       # seeds from ../website/lib/content.ts
  public/
  src/
    app/
      layout.tsx                  # root: fonts, providers
      globals.css                 # Tailwind v4 @theme tokens (admin light theme)
      (auth)/
        login/page.tsx
      (dashboard)/                # protected group — wrapped by AppShell
        layout.tsx                # sidebar + topbar shell, auth guard
        dashboard/page.tsx        # P3 Overview
        orders/page.tsx
        orders/[id]/page.tsx
        menu/page.tsx
        reservations/page.tsx
        outlets/page.tsx
        staff/page.tsx
        customers/page.tsx
        inventory/page.tsx
        reports/page.tsx
        settings/page.tsx
      api/
        auth/[...nextauth]/route.ts
        dashboard/route.ts        # aggregated KPIs
        orders/route.ts           # + [id]/route.ts
        menu/route.ts             # + [id]/route.ts
        reservations/route.ts
        outlets/route.ts
        staff/route.ts
    components/
      ui/                         # primitives: Button, Card, Input, Badge, Table, Modal, Select...
      charts/                     # LineChart, RadialGauge, BarStat (Recharts wrappers)
      layout/                     # Sidebar, Topbar, SearchBar, UserMenu
      dashboard/                  # KpiCard, TrendingItem, RecentOrders, EmployeeStatus...
    lib/
      auth.ts                     # Auth.js config
      db.ts                       # Prisma client singleton
      api-client.ts               # typed fetch wrapper
      query-client.ts             # TanStack Query
      utils.ts                    # cn(), formatCurrency, formatDate
    schemas/                      # Zod schemas (menu, order, reservation, staff)
    types/                        # shared TS types
    store/                        # Zustand stores (ui, filters)
    hooks/                        # useOrders, useMenu, useDashboard...
```

---

## PHASE 0 — Foundation & Tooling

**Goal:** A blank but fully-configured Next.js 16 + Tailwind v4 admin app that runs on `:3001`.

### Tasks
1. Scaffold in `/admin` (manual, to match website's exact versions — do **not** rely on defaults):
   - `package.json` mirroring `website/package.json` versions: `next@^16`, `react@^19`, `react-dom@^19`,
     dev: `tailwindcss@^4`, `@tailwindcss/postcss@^4`, `postcss`, `typescript@^6`, `@types/*`.
   - `next.config.mjs` — `reactStrictMode`, `images.remotePatterns` for `images.unsplash.com` (menu photos).
   - `postcss.config.mjs` — `@tailwindcss/postcss`.
   - `tsconfig.json` — strict, `@/*` → `src/*` path alias.
2. Install core libs:
   `@tanstack/react-query @tanstack/react-table zustand recharts react-hook-form zod @hookform/resolvers lucide-react clsx tailwind-merge date-fns`
3. Create `src/app/globals.css` with the **admin design tokens** (light theme — see §Design Tokens below).
4. Create `src/lib/utils.ts` with `cn()` (clsx + tailwind-merge), `formatCurrency`, `formatDate`.
5. Root `src/app/layout.tsx`: load fonts (reuse website's *Manrope* + *Fraunces* via `next/font`), wrap
   children in providers (added in P1/P6).
6. Add `dev` script `next dev -p 3001`.

### Design Tokens (admin `@theme`, light theme matching the mockup)
```css
@import 'tailwindcss';
@theme {
  /* Surfaces (light) */
  --color-bg:        #f6f7f9;   /* app background */
  --color-surface:   #ffffff;   /* cards */
  --color-border:    #ececf0;
  /* Text */
  --color-fg:        #1a1a1a;
  --color-fg-muted:  #8a8f99;
  /* Brand accent — reused from website */
  --color-accent:        #f15a24;  /* primary orange (mockup CTA/active) */
  --color-accent-soft:   #ffece4;
  --color-gold:          #e0a04b;
  /* Status */
  --color-success: #16a34a;  /* "+7.5%", Completed */
  --color-danger:  #ef4444;  /* "-3.5%", Canceled */
  --color-warn:    #f59e0b;  /* On Break */
  /* Radius / shadow */
  --radius-card: 1rem;
  --shadow-card: 0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.04);
}
```

### Acceptance Criteria
- [ ] `npm run dev` serves a blank page on `http://localhost:3001`.
- [ ] Tailwind utilities + custom `bg-accent`/`text-fg-muted` tokens render.
- [ ] TypeScript strict passes with zero errors. `@/` alias resolves.

---

## PHASE 1 — Auth & RBAC

**Goal:** Only authenticated admins reach the dashboard; routes are role-gated.

### MySQL setup (datasource)
```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
generator client { provider = "prisma-client-js" }
```
```bash
# .env.local
DATABASE_URL="mysql://root:password@localhost:3306/restaurant_admin"
AUTH_SECRET="<openssl rand -base64 32>"
```
> **MySQL notes (apply to all later phases):**
> - Money fields use `Decimal @db.Decimal(10, 2)` so MySQL stores fixed-precision (not float).
> - Prisma `enum` maps to a native MySQL `ENUM` column — supported on MySQL 8.
> - Local dev DB via Docker: `docker run --name restaurant-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=restaurant_admin -p 3306:3306 -d mysql:8`.
> - Use `npx prisma migrate dev` for schema changes; `npx prisma db seed` to load data.

### Data
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String              // bcrypt hash
  role      Role     @default(STAFF)
  avatarUrl String?
  outletId  String?             // null = all outlets
  createdAt DateTime @default(now())
}
enum Role { OWNER MANAGER STAFF }   // mockup persona: "Sales Manager"
```

### Tasks
1. Add `prisma`, `@prisma/client`, `@auth/prisma-adapter`, `next-auth@beta`, `bcryptjs`.
2. `prisma/schema.prisma` (MySQL datasource above) with `User` + `Role`; run `prisma migrate dev`; create `src/lib/db.ts` (singleton).
3. `src/lib/auth.ts` — Auth.js Credentials provider (verify bcrypt), JWT strategy, `role` in token/session.
4. `src/app/api/auth/[...nextauth]/route.ts`.
5. `(auth)/login/page.tsx` — branded login form (React Hook Form + Zod), accent button, error states.
6. `(dashboard)/layout.tsx` — server-side `auth()` guard; redirect unauthenticated → `/login`.
7. `src/lib/rbac.ts` — `can(role, action)` helper + `<RequireRole>` wrapper for nav/actions.
8. Seed an OWNER user in `prisma/seed.ts` (e.g. the mockup's "George Daniel").

### Acceptance Criteria
- [ ] Visiting any `(dashboard)` route while logged out redirects to `/login`.
- [ ] Valid credentials log in; session persists across refresh; `role` available server + client.
- [ ] STAFF role cannot see/hit OWNER-only routes (settings, staff management).
- [ ] Logout clears session and returns to `/login`.

---

## PHASE 2 — App Shell & Navigation

**Goal:** The persistent chrome from the mockup — left icon sidebar, top search/profile bar.

### Tasks
1. `components/layout/Sidebar.tsx` — fixed left rail, restaurant logo, nav icons (lucide), active state
   = accent pill (matches mockup's highlighted Overview icon). Collapsible (Zustand `useUiStore`).
   Bottom group: notifications, settings, logout.
2. `components/layout/Topbar.tsx` — page title + subtitle ("Manage your restaurant & team members from
   here."), centered global search ("type here to search anything", ⌘F), right-side user card
   (avatar + name + role, from session).
3. `components/layout/SearchBar.tsx` — command-palette-style (⌘K) global search (wire data in later phases).
4. `(dashboard)/layout.tsx` — compose Sidebar + Topbar + scrollable `<main>` content area; responsive:
   sidebar → drawer under `lg`.
5. `components/ui/*` primitives needed app-wide: `Button`, `Card`, `Badge`, `Avatar`, `Input`,
   `Select`, `Dropdown`, `Skeleton`. Build on tokens from P0.

### Acceptance Criteria
- [ ] Sidebar matches mockup layout; active route highlighted in accent.
- [ ] Topbar shows the logged-in user (name + role) and a working search input.
- [ ] Layout is responsive: sidebar collapses to a drawer on tablet/mobile.
- [ ] All nav links route correctly (stub pages OK until their phase).

---

## PHASE 3 — Dashboard / Overview  ⭐ (the attached mockup)

**Goal:** Pixel-faithful rebuild of the attached Overview screen, data-driven.

### Component → Mockup mapping
| Mockup element | Component | Notes |
|----------------|-----------|-------|
| Total Orders / Delivered / Canceled / Revenue cards | `dashboard/KpiCard.tsx` | Icon, value, ±% delta vs last month (green/red), accent-filled active card |
| Trending Menu Item | `dashboard/TrendingItem.tsx` | Image, name, rating ★, order count, price |
| Outlets Operational Cost vs Revenue | `charts/LineChart.tsx` | Dual line (Sells vs Operational Cost), Weekly toggle, hover tooltips ($14K / $10.5K), per-outlet x-axis |
| Top Categories Item | `dashboard/CategoryStats.tsx` | 3 image tiles + % (Seafood 65%, Beverage 45%, Desserts 81%) |
| Employee status | `charts/RadialGauge.tsx` | On Duty / On Break / Absent split + total employees |
| POS Activities (Total Sales, bills, AVG, peak) | `dashboard/PosActivities.tsx` | "Today's" toggle, +12% since yesterday |
| Payment Method | `charts/RadialGauge.tsx` | Cash 60% / Card 25% / Online 15%, "View Details" CTA |
| Recent Orders | `dashboard/RecentOrders.tsx` | Card list: image, name, order id, outlet, status badge, price |
| Sales & Order Types | `charts/BarStat.tsx` | Dine-in 40% / Delivery 35% / Pick-up 25% |

### Tasks
1. Build the `charts/` wrappers (Recharts): `LineChart`, `RadialGauge`, `BarStat` — themed to tokens,
   responsive containers, accessible (titles, `aria-label`).
2. Build each `dashboard/*` widget as a presentational component taking typed props.
3. `api/dashboard/route.ts` — return an aggregated `DashboardData` payload (KPIs, series, recent orders).
   Phase 3 may return **mock/seed data**; real aggregation lands as Orders/Outlets fill (P5/P7).
4. `hooks/useDashboard.ts` — TanStack Query fetch + loading skeletons + error/empty states.
5. `dashboard/page.tsx` — responsive grid matching the mockup (12-col; KPI row, 2/3 + 1/3 split, etc.).
6. Period toggles (Weekly / Today's) update queries.

### Acceptance Criteria
- [ ] Layout visually matches the mockup at desktop; reflows cleanly to 1-col on mobile.
- [ ] Every widget renders from `useDashboard()` data (no hard-coded values in components).
- [ ] Loading shows skeletons; empty/error states handled.
- [ ] Charts are responsive and have accessible labels.

---

## PHASE 4 — Menu Management

**Goal:** CRUD for menu items and categories, seeded from `website/lib/content.ts`.

### Data
```prisma
model Category { id String @id @default(cuid()); name String @unique; items MenuItem[] }
model MenuItem {
  id String @id @default(cuid())
  name String; description String @db.Text; price Decimal @db.Decimal(10, 2)
  rating Float @default(0); tag String?
  imageUrl String; available Boolean @default(true)
  categoryId String; category Category @relation(fields:[categoryId], references:[id])
  outletId String?
  createdAt DateTime @default(now())
}
```
> Mirrors the website's `MenuItem` interface — `prisma/seed.ts` imports `MENU_ITEMS` / `MENU_CATEGORIES`
> from `../website/lib/content.ts` so site and admin share one menu.

### Tasks
1. Prisma models + migration + seed from website content.
2. `schemas/menu.ts` — Zod schema shared by form + API.
3. `api/menu/route.ts` (list/create) + `api/menu/[id]/route.ts` (get/update/delete).
4. `menu/page.tsx` — TanStack Table grid: image, name, category, price, rating, availability toggle,
   row actions. Filter by category, search by name.
5. Create/Edit drawer or `/menu/[id]` — RHF form (image URL/upload, price, category select, tag, availability).
6. Category manager (add/rename/delete) with item-count guard on delete.

### Acceptance Criteria
- [ ] Seeded items from the website appear in the grid.
- [ ] Create/edit/delete works with optimistic UI + server validation (Zod).
- [ ] Toggling `available` reflects immediately and persists.
- [ ] Deleting a category in use is blocked with a clear message.

---

## PHASE 5 — Orders & POS

**Goal:** Order lifecycle management + the POS activity data feeding the dashboard.

### Data
```prisma
model Order {
  id String @id @default(cuid())
  number String @unique            // e.g. ORD-1001
  type OrderType                   // DINE_IN | DELIVERY | PICKUP
  status OrderStatus @default(PENDING)
  total Decimal @db.Decimal(10, 2); paymentMethod PaymentMethod?
  outletId String; customerId String?
  items OrderItem[]
  createdAt DateTime @default(now())
}
model OrderItem { id String @id @default(cuid()); orderId String; menuItemId String; qty Int; price Decimal @db.Decimal(10, 2) }
enum OrderType { DINE_IN DELIVERY PICKUP }
enum OrderStatus { PENDING PREPARING READY COMPLETED CANCELED }
enum PaymentMethod { CASH CARD ONLINE }
```

### Tasks
1. Models + migration + a realistic order seed (drives dashboard charts).
2. `api/orders` list (filters: status, type, outlet, date range; pagination) + `[id]` detail/update.
3. `orders/page.tsx` — data grid with status badges (Completed=green, Canceled=red — matches mockup),
   filters, search, pagination.
4. `orders/[id]/page.tsx` — order detail: items, totals, customer, status transitions (state machine).
5. Wire **real** dashboard aggregations now: Total Orders/Delivered/Canceled/Revenue, Sales & Order
   Types %, Payment Method %, Recent Orders → all computed from `Order` data.

### Acceptance Criteria
- [ ] Orders grid filters/sorts/paginates; status badges match mockup styling.
- [ ] Status transitions enforce valid moves (e.g. can't go Completed → Pending).
- [ ] Dashboard KPIs and Sales/Payment charts now reflect real order data.

---

## PHASE 6 — Reservations & Private Events (website integration)

**Goal:** Turn the public site's **fake** reservation flow into real, manageable bookings.

> Today [`website/components/ReservationFlow.tsx`](../website/components/ReservationFlow.tsx) only
> generates a `Date.now()` reference and shows confetti — nothing is stored. This phase makes it real.

### Data
```prisma
model Reservation {
  id String @id @default(cuid())
  reference String @unique          // SV-xxxxxx / EV-xxxxxx
  kind ReservationKind              // TABLE | PRIVATE_EVENT
  status ReservationStatus @default(REQUESTED)
  date DateTime; time String?; guests Int?; guestRange String?
  name String; email String; phone String
  occasion String?; eventType String?; space String?; company String?
  requests String?; outletId String?
  createdAt DateTime @default(now())
}
enum ReservationKind { TABLE PRIVATE_EVENT }
enum ReservationStatus { REQUESTED CONFIRMED SEATED COMPLETED CANCELED NO_SHOW }
```

### Tasks
1. Models + migration. Shared Zod schema (mirrors `TableForm` / `PrivateForm`).
2. **Website change:** add `website/app/api/reservations/route.ts` (or point to admin API) so the
   reservation flow POSTs real data; keep the existing UX/confetti on success.
3. Admin `api/reservations` + `reservations/page.tsx` — calendar/list view, status workflow
   (confirm / seat / cancel / no-show), filters by date & kind.
4. Reservation detail drawer with guest info and notes.
5. Optional: email confirmation hook on confirm.

### Acceptance Criteria
- [ ] A booking submitted on the public site appears in admin `/reservations`.
- [ ] Admin can move a reservation through its status workflow.
- [ ] Table vs Private Event distinguished and filterable.

---

## PHASE 7 — Outlets & Operations

**Goal:** The multi-outlet backbone behind the dashboard's "Outlet 01–08" chart.

### Data
```prisma
model Outlet {
  id String @id @default(cuid())
  name String                       // "Outlet 05"
  address String?; phone String?
  isActive Boolean @default(true)
  metrics OutletMetric[]
}
model OutletMetric {                // weekly operational cost vs revenue series
  id String @id @default(cuid())
  outletId String; periodStart DateTime
  revenue Decimal @db.Decimal(12, 2); operationalCost Decimal @db.Decimal(12, 2)
}
```

### Tasks
1. Models + migration + seed (8 outlets, weekly metrics → feeds the line chart).
2. `api/outlets` CRUD + metrics endpoint with `period` param (Weekly/Monthly toggle).
3. `outlets/page.tsx` — outlet list, per-outlet detail, metric entry/import.
4. Wire the dashboard "Operational Cost vs Revenue" line chart + the `$3,500 Revenue` summary to real
   `OutletMetric` data, including the period toggle.
5. Scope all data (orders, menu, staff) by `outletId`; add an outlet switcher in the topbar.

### Acceptance Criteria
- [ ] Dashboard line chart driven by real outlet metrics; Weekly/Monthly toggle works.
- [ ] Outlet switcher filters dashboard + module data.

---

## PHASE 8 — Staff / Employees

**Goal:** Employee directory + the "Employee status" gauge (On Duty / On Break / Absent).

### Data
```prisma
model Employee {
  id String @id @default(cuid())
  name String; role String          // "Chef", "Server", "Sales Manager"
  email String?; phone String?; avatarUrl String?
  status DutyStatus @default(OFF)    // ON_DUTY | ON_BREAK | ABSENT | OFF
  outletId String; userId String?    // optional link to login User
}
enum DutyStatus { ON_DUTY ON_BREAK ABSENT OFF }
```

### Tasks
1. Models + migration + seed (~120 employees → matches "Total Employees 120").
2. `api/staff` CRUD + status update.
3. `staff/page.tsx` — directory grid, role/status filters, status quick-set.
4. Wire the dashboard "Employee status" radial gauge (On Duty 83 / On Break 10 / Absent 07) to live counts.
5. (Optional) basic shift scheduling.

### Acceptance Criteria
- [ ] Staff directory CRUD works; status changes reflect on the dashboard gauge in real time.
- [ ] Counts (total / on-duty / break / absent) match the directory.

---

## PHASE 9 — Customers / CRM

**Goal:** Customer records aggregated from orders and reservations.

### Tasks
1. `Customer` model (name, email, phone, order/reservation history, total spend, visits).
2. Link `Order.customerId` / `Reservation` email → customer.
3. `customers/page.tsx` — list, search, customer detail (history, lifetime value).

### Acceptance Criteria
- [ ] Placing orders / making reservations associates with a customer record.
- [ ] Customer detail shows aggregated history and spend.

---

## PHASE 10 — Inventory (optional / can defer)

**Goal:** Track stock, low-stock alerts, link to menu items.

### Tasks
1. `InventoryItem` (name, unit, quantity, reorderLevel, supplier) + optional `MenuItem` ↔ ingredient links.
2. `api/inventory` CRUD; low-stock computed flag.
3. `inventory/page.tsx` — grid with low-stock highlighting + adjustments log.

### Acceptance Criteria
- [ ] Stock levels editable; items below reorder level are flagged.

---

## PHASE 11 — Reports & Analytics

**Goal:** Deeper, exportable analytics beyond the overview.

### Tasks
1. `reports/page.tsx` — date-range reports: revenue, top items, category mix, order-type trends,
   outlet comparison.
2. Reuse `charts/` components; add CSV/PDF export.
3. Server-side aggregation endpoints with caching.

### Acceptance Criteria
- [ ] Reports filter by date range + outlet; export to CSV works.

---

## PHASE 12 — Settings, Profile & Notifications

**Goal:** Configuration surfaces and the bottom-sidebar items.

### Tasks
1. `settings/page.tsx` — restaurant profile, outlets, tax/currency, brand, theme toggle (light/dark),
   roles & permissions (OWNER only).
2. Profile/account page (name, avatar, password change).
3. `notifications/page.tsx` + topbar bell — activity feed (new orders, reservations, low stock).
4. Persist theme + sidebar prefs (Zustand + localStorage).

### Acceptance Criteria
- [ ] Settings persist; theme toggle switches light/dark; role management gated to OWNER.
- [ ] Notifications surface key events.

---

## PHASE 13 — Hardening (a11y · perf · testing · deploy)

### Tasks
1. **Accessibility:** keyboard nav, focus rings (reuse website's gold focus style), `aria-*` on charts
   and interactive widgets, color-contrast audit, `prefers-reduced-motion`.
2. **Performance:** route-level code splitting, `next/image` for all photos, memoize chart data,
   `loading.tsx` / Suspense skeletons, query caching tuned.
3. **Testing:** Vitest + React Testing Library (components/hooks); Playwright e2e for login → dashboard →
   create order → see it on dashboard. Zod schema unit tests.
4. **Quality gates:** ESLint + Prettier + `tsc --noEmit` in CI (GitHub Actions); Prisma migrate check.
5. **Deploy:** env config, **MySQL provisioning** (managed MySQL 8 — e.g. PlanetScale/RDS/Railway — set `DATABASE_URL`), run `prisma migrate deploy`, `npm run build`, deploy target (Vercel/Docker). Document in README.

### Acceptance Criteria
- [ ] Lighthouse a11y ≥ 95 on dashboard.
- [ ] e2e happy path green in CI.
- [ ] `npm run build` clean; deployable with documented env vars.

---

## 4. Shared Data Model (consolidated ERD)

```
User ──< (manages)          Outlet ──< OutletMetric
Outlet ──< MenuItem >── Category
Outlet ──< Order ──< OrderItem >── MenuItem
Outlet ──< Reservation
Outlet ──< Employee ── User?
Customer ──< Order
Customer ──< Reservation   (matched by email)
InventoryItem (optional) ── MenuItem?
```

## 5. API Surface (Route Handlers)

| Method | Route | Phase |
|--------|-------|-------|
| `*` | `/api/auth/[...nextauth]` | P1 |
| `GET` | `/api/dashboard?period=` | P3 |
| `GET/POST` | `/api/menu` · `GET/PUT/DELETE /api/menu/[id]` | P4 |
| `GET/POST` | `/api/orders` · `GET/PUT /api/orders/[id]` | P5 |
| `GET/POST` | `/api/reservations` · `PUT /api/reservations/[id]` | P6 |
| `GET/POST` | `/api/outlets` · `GET /api/outlets/[id]/metrics` | P7 |
| `GET/POST` | `/api/staff` · `PUT /api/staff/[id]` | P8 |
| `GET` | `/api/customers` · `/api/reports` · `/api/inventory` | P9–11 |

## 6. Definition of Done (per phase)
- Type-safe end to end (Zod schema shared client/server; no `any`).
- Loading / empty / error states for every async view.
- Responsive at `sm / md / lg / xl`.
- Keyboard accessible; visible focus.
- Lint + typecheck clean.
- Brief note added to `admin/README.md` describing the new module.

---

## 7. Suggested Build Order (fastest path to a demo)
**P0 → P1 → P2 → P3** gives a logged-in, navigable dashboard matching the mockup (with seed data) — the
strongest early demo. Then **P4 → P5 → P7** make the dashboard numbers *real*, and **P6** delivers the
headline integration (public-site reservations flowing into the admin). P8–P13 layer on the rest.
```
P0 ─ P1 ─ P2 ─ P3 ─┬─ P4 ─ P5 ─┬─ P7 ─ P11
                   ├─ P6        ├─ P9
                   └─ P8        └─ P10
                                 P12 ─ P13
```



##### feedback_implementation_plan
# Table of Contents

1. Online Ordering Flow
2. QR Scan Menu
3. Customer & Staff Management
4. Remove Outlet Module
5. Table-wise QR Ordering
6. Gift Card & Coupon Management

---

# TASK 1 – Online Ordering Flow

## Objective

Develop a complete online ordering system that allows customers to place orders for **Take Away** or **Dine-In**, with support for immediate ordering and scheduled reservations.

**Reference Flow**

https://online.skytab.com/9c38c8cc69d40c0f3e02e71e08ce4f33

---

## Functional Requirements

### 1. Order Type Selection

Customers must be able to choose one of the following order types:

* Take Away
* Dine-In

---

## Take Away Flow

### Schedule Now

* Place order immediately.
* Order is sent directly to the kitchen.
* System automatically calculates estimated pickup time.

### Schedule Later

Allow customers to schedule an order by selecting:

* Date
* Time Slot

Requirements:

* Display only available business hours.
* Validate cutoff time before accepting orders.
* Prevent booking unavailable time slots.

---

## Dine-In Reservation Flow

Customers should be able to:

* Select reservation date
* Select reservation time
* Enter guest count
* Add optional notes

Requirements:

* Calendar picker
* 30-minute interval time slots
* Show only available slots
* Prevent double bookings
* Store reservation with customer details

Example Time Slots

```
10:00 AM
10:30 AM
11:00 AM
11:30 AM
12:00 PM
```

---

## Reservation Synchronization

Every reservation created from the website must automatically sync with the Admin Panel.

Admin should be able to:

* View reservations
* Search reservations
* Filter by date
* Filter by status
* Edit reservation
* Confirm reservation
* Cancel reservation
* Mark reservation as completed

### Reservation Status

```
Pending
Confirmed
Checked In
Completed
Cancelled
```

---

## Database Structure

### reservations

```
id
customer_id
reservation_type
reservation_date
reservation_time
guest_count
status
notes
created_at
updated_at
```

### orders

```
id
reservation_id
customer_id
order_type
schedule_type
schedule_date
schedule_time
status
created_at
updated_at
```

---

# # TASK 2 – QR Scan Menu

## Objective

Implement a QR-based digital menu that allows customers to view the restaurant menu directly in their web browser without downloading or installing any mobile application. The website menu must always remain synchronized with the Admin Panel.

---

## Functional Requirements

### 1. QR Menu Access

* Customer scans the QR code placed at the restaurant.
* The menu opens directly in the web browser.
* No mobile application installation is required.
* No customer login is required to browse the menu.

---

### 2. Website Menu Synchronization

The website menu should always be synchronized with the Admin Panel.

Whenever the Admin performs any of the following actions:

* Add a new category
* Add a new menu item
* Update menu details
* Change product price
* Mark a product as Available/Unavailable
* Enable or disable a category
* Delete a menu item

The website should automatically reflect the latest changes.

---

### 3. Available Menu Display

Only menu items marked as **Available** in the Admin Panel should be displayed on the website.

Do **not** display:

* Unavailable menu items
* Disabled menu categories
* Hidden products
* Deleted menu items

---

## Website Menu Flow

```text
Admin Panel
      │
      │ Add / Update / Delete Menu
      │
      ▼
Database Updated
      │
      ▼
Website Menu Synchronization
      │
      ▼
Customer Scans QR Code
      │
      ▼
Website Displays Only Available Menu Items
```

---

## Acceptance Criteria

* QR code opens the menu directly in the browser.
* No app installation is required.
* Website menu remains synchronized with the Admin Panel.
* Only available menu items and active categories are displayed.
* Any menu changes made in the Admin Panel are reflected on the website automatically.


Website should always display the latest menu data.

---

# TASK 3 – Customer & Staff Management

## Objective

Develop complete CRUD modules for Customers and Staff within the Admin Panel.

---

## Customer Management

### Features

* Add Customer
* Edit Customer
* Delete Customer
* View Customer
* Search Customer
* Filter Customer

### Fields

```
Name
Email
Phone
Address
Status
Created Date
```

---

## Staff Management

### Features

* Add Staff
* Edit Staff
* Delete Staff
* View Staff
* Search Staff
* Assign Roles
* Activate/Deactivate Staff

### Fields

```
Name
Email
Phone
Password
Role
Status
Created Date
```

### Roles

```
Super Admin
Manager
Cashier
Kitchen Staff
Waiter
```

---

# TASK 4 – Remove Outlet Module

## Objective

Convert the application into a **single-outlet restaurant management system** by removing all multi-outlet functionality.

---

## Implementation Scope

Remove:

* Outlet CRUD
* Outlet Selection
* Outlet Mapping
* Outlet APIs
* Outlet Filters
* Outlet Relationships
* Outlet Foreign Keys (where applicable)

---

## Modules to Update

* Dashboard
* Orders
* Reservations
* Menu
* Coupons
* QR Ordering
* Reports

---

# TASK 5 – Table-wise QR Ordering System

## Objective

Generate unique QR codes for each restaurant table, allowing customers to place orders directly from their table.

---

## Table Management (Admin)

### CRUD Operations

* Add Table
* Edit Table
* Delete Table
* Generate QR Code
* Download QR Code
* Print QR Code

---

## Table Fields

```
Table Number
Table Name
QR Code
Status
```

---

## QR Ordering Flow

Customer

↓

Scan Table QR

↓

Menu Opens

↓

Table Automatically Identified

↓

Customer Adds Items

↓

Checkout

↓

Kitchen Receives Order with Table Number

---

## Admin Order View

Display:

```
Table Number
Customer Name
Items
Quantity
Order Status
Order Time
```

---

## Database

### tables

```
id
table_number
table_name
qr_code
status
created_at
updated_at
```

### orders

```
table_id
```

---

# TASK 6 – Gift Card & Coupon Management

## Objective

Implement a complete Gift Card and Coupon Management System integrated with the Admin Panel.

---

## Customer Purchase Flow

Customer

↓

Select Gift Card or Coupon

↓

Choose Amount

↓

Checkout

↓

Payment Successful

↓

Generate Unique Coupon Code

↓

Save Purchase Record

↓

Send Confirmation

---

## Database Structure

### gift_cards

```
id
coupon_code
customer_id
amount
expiry_date
payment_status
status
created_at
updated_at
```

---

## Admin Panel Features

### Purchase Management

* View Purchases
* Search Purchases
* Filter Purchases
* View Customer Details
* View Coupon Code
* View Amount
* View Payment Status

---

## CRUD Operations

Admin can:

* View
* Edit
* Delete
* Activate Coupon
* Deactivate Coupon
* Expire Coupon
* Export Purchase Records

---

## Coupon Status

```
Pending Payment
Paid
Active
Redeemed
Expired
Cancelled
```

---

# Acceptance Criteria

The implementation will be considered complete when:

* Online ordering supports both Take Away and Dine-In with scheduling.
* Reservation data is synchronized with the Admin Panel.
* QR menu is accessible without app installation.
* Website menu automatically syncs with the Admin Panel.
* Customer and Staff CRUD modules are fully operational.
* Multi-outlet functionality is completely removed.
* Table-wise QR ordering is fully functional with automatic table identification.
* Gift Card and Coupon purchase workflow is implemented.
* Coupon purchases are stored in the database and manageable through the Admin Panel.
* All modules are integrated, tested, and production-ready.

---

# Deliverables

* Online Ordering Module
* Reservation Management Module
* QR Menu Module
* Customer Management Module
* Staff Management Module
* Table Management Module
* QR Code Generator
* Table-wise Ordering Module
* Gift Card & Coupon Module
* Admin Panel Integration
* Database Migrations
* API Integration
* Production Testing & Documentation

