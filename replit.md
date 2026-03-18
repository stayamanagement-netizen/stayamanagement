# Workspace

## Overview

**Staya Management** — a luxury villa management platform. pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: Next.js 15 (App Router, server mode — `output: 'export'` removed to support middleware)
- **API framework**: Express 5 (dev only; profile route is also in Next.js `app/api/`)
- **Auth & DB**: Supabase (`@supabase/ssr` — `createBrowserClient` for browser, `createServerClient` in middleware)
- **Middleware**: `artifacts/nextjs-app/middleware.ts` — server-side session check, route protection, and login redirect
- **Build**: esbuild (CJS bundle for API server), Next.js server build for frontend

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── nextjs-app/         # Next.js 15 frontend (all portals)
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`).
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/nextjs-app` (`@workspace/nextjs-app`)

Next.js 15 App Router frontend. All portals live here.

**Pages/portals:**
- `/` — login (password + OTP magic link)
- `/auth/callback` — PKCE magic link exchange, role-based redirect
- `/dashboard/guest/` — Guest portal (5 pages: home, services, messages, booking, emergency)
- `/dashboard/owner/` — Owner portal
- `/dashboard/manager/` — Manager portal
- `/dashboard/admin/` — Admin portal

**Auth guard pattern (all portal pages):**
1. `supabase.auth.getUser()` client-side
2. POST `/api/auth/profile` → API server (Express) → Supabase service role lookup
3. Role-based redirect (super_admin→/dashboard/admin, wrong role→/)

**Deployment (production):**
- `next.config.ts`: `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`
- Build script: `next build && rm -rf dist/public && mv out dist/public`
- Static export goes to `artifacts/nextjs-app/dist/public/` (what `artifact.toml` expects)
- In production: Replit static server serves `dist/public/` at path `/`

**Important: No Next.js API routes.** All `/api` traffic routes to the Express API server.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Mounts at `/api`.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — CORS, JSON parsing, routes mounted at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers:
  - `health.ts` → `GET /api/healthz`
  - `profile.ts` → `POST /api/auth/profile` — looks up user role using Supabase service role key
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@supabase/supabase-js`
- `pnpm --filter @workspace/api-server run dev` — dev server (tsx)
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)

**Env vars used by API server:**
- `NEXT_PUBLIC_SUPABASE_URL` — shared env var
- `SUPABASE_SERVICE_ROLE_KEY` — Replit secret

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI spec + Orval codegen. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server`.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run: `pnpm --filter @workspace/scripts run <script>`.

## Portal Pages

### Owner Portal (`/dashboard/owner`)
- `page.tsx` — dashboard (stats, today's schedule, messages, emergencies)
- `petty-cash/page.tsx` — category totals only (no individual items)
- `maintenance/page.tsx` — issues list (NO cost visibility)
- `villa/page.tsx` — property details (read-only)
- `revenue/page.tsx` — revenue & income data
- `statements/page.tsx` — financial statements
- `bookings/page.tsx` — reservations (guest initials only)
- `settings/page.tsx` — profile editing (name, phone), password change, notification preferences

### Admin Portal (`/dashboard/admin`)
- `page.tsx` — dashboard (stats, bookings, services, messages, emergencies)
- `villas/page.tsx` — villa management CRUD
- `bookings/page.tsx` — all bookings with full detail
- `channel-manager/page.tsx` — OTA channel management and iCal sync
- `messages/page.tsx` — inbox with quick reply templates and host-side messaging
- `petty-cash/page.tsx` — review all villa expense submissions; approve/reject; CSV export; summary cards; filters by villa/status/category/date
- `maintenance/page.tsx` — all maintenance requests; priority badges; detail modal; inline status updates; filters
- `services/page.tsx` — service order management
- `payments/page.tsx` — payment records
- `payments/rules/page.tsx` — payment rules
- `emergencies/page.tsx` — emergency management
- `settings/page.tsx` — profile editing (name, phone), password change, notification preferences

### Manager Portal (`/dashboard/manager`)
- `page.tsx` — dashboard (stats, today schedule, pending orders, messages, emergencies)
- `villa/page.tsx` — read-only property details + OTA channel badges
- `bookings/page.tsx` — view-only reservations with check-in/out status, expandable details
- `messages/page.tsx` — inbox (read + reply); saves with `sender_role: villa_manager`, `admin_notified: false`
- `petty-cash/page.tsx` — submit new expense + view own submissions
- `maintenance/page.tsx` — report new issue + track status (can see costs)
- `services/page.tsx` — service orders: Confirm (pending→confirmed) + Complete (confirmed→completed) + notes
- `emergencies/page.tsx` — acknowledge alerts + add internal notes (cannot resolve)
- `settings/page.tsx` — profile editing (name, phone), password change, notification preferences

### Common CSS Class Conventions
- Owner sidebar: `owner-sidebar` / `owner-content` (defined inline in `<style>` block each page)
- Manager sidebar: `mgr-sidebar` / `mgr-content` (defined inline in `<style>` block each page)
- Breakpoints: 900px (shrink sidebar 220px→180px), 640px (hide sidebar, full-width content)

## Design System

- Background: `#F5F0E8` (warm beige)
- Accent: `#C9A84C` (gold)
- Text: `#2C2C2C`
- Sidebar: `#2C1E0F` (dark brown)
- Fonts: Playfair Display (headings), Inter (body)
- Emergency pages: Red theme (`#C62828`, `#FFF5F5`)
- Inline CSS throughout (no Tailwind used in runtime components)
- Mobile-first, max-width 540px, fixed bottom nav 62px for guest portal

## Key Rules

- All redirects use `window.location.href` (never `router.push`) for full page reload with fresh session
- Auth guard on every portal page: verify user → fetch profile from API server → role check
- Supabase client-side uses anon key; server-side (API routes) uses service role key
- Never add Next.js API routes — all `/api` traffic goes to the Express API server

## Deployment

- **Next.js**: Static export → `dist/public/` → served by Replit static file server
- **API server**: esbuild bundle → `dist/index.cjs` → `node dist/index.cjs`
- Routing: `/api/*` → API server (port 8080), `/*` → Next.js static files
- Artifact config: `artifacts/nextjs-app/.replit-artifact/artifact.toml` (system-managed)
