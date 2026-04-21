# Dashboard Inventory Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/portal/dashboards` a real dashboard inventory across accessible apps, and make dashboard rows open directly with a menu for rename/export/remove plus app-scoped default embed selection.

**Architecture:** Extend `DashboardRecord` with metadata persisted on the Dashboard model. Backend dashboard services expose rename/remove and richer dashboard records; web route/pages compose accessible app scoped calls into global and app-local table views. The selected dashboard preference remains the default embed source.

**Tech Stack:** Prisma 7 schema/client, Fastify backend, Next.js App Router RSC pages, shadcn table/dropdown/dialog/button components, Vitest.

---

## Files

- Modify `packages/contracts/src/dashboards.ts`: add metadata fields.
- Modify `packages/db/prisma/schema.prisma`: add Dashboard metadata.
- Create `packages/db/prisma/migrations/0008_dashboard_metadata/migration.sql`: add DB columns.
- Modify `packages/db/src/dashboard-store.ts`: map metadata, create with author, rename, remove.
- Modify `apps/backend/src/modules/dashboards/app.ts`: service methods and PATCH/DELETE routes.
- Modify `apps/backend/src/api/schema.ts`: dashboard schema metadata fields.
- Modify `apps/web/src/lib/portal/backend-client.ts`: type metadata and add rename/remove calls.
- Modify `apps/web/src/lib/portal/api-client.ts`: type metadata and add rename/remove calls.
- Modify `apps/web/src/app/api/canvas/dashboards/route.ts`: preserve metadata in web proxy.
- Create API routes under `apps/web/src/app/api/canvas/dashboards/[dashboardId]/route.ts` for rename/remove.
- Modify `apps/web/src/app/portal/dashboards/page.tsx`: global dashboard table instead of redirect.
- Modify `apps/web/src/app/portal/[appName]/page.tsx`: use richer row data.
- Modify `apps/web/src/components/portal/dashboard-list.tsx`: row click, default embed toggle, row menu.
- Add focused tests in existing backend/web/page/component tests.

## Task 1: Data And Backend

- [ ] Write failing tests for Dashboard metadata, rename, remove, and backend routes.
- [ ] Update contract, Prisma schema/migration, store methods, API schema, and backend routes.
- [ ] Run backend/db focused tests.

## Task 2: Web API And Pages

- [ ] Write failing tests for `/portal/dashboards` rendering a cross-app list and app page row behavior.
- [ ] Update backend/api clients and web API route handlers.
- [ ] Replace legacy redirect with global inventory page.

## Task 3: Dashboard Row UI

- [ ] Update `DashboardList` to render metadata columns, clickable rows, default embed toggle, and dropdown menu.
- [ ] Add rename dialog/menu actions and remove/export controls.
- [ ] Run focused web tests.

## Verification

- [ ] `corepack pnpm vitest run packages/db/src/dashboard-store.test.ts`
- [ ] `corepack pnpm vitest run apps/backend/src/modules/dashboards/app.test.ts`
- [ ] `corepack pnpm vitest run apps/web/src/app/portal/dashboards/page.test.tsx`
- [ ] `corepack pnpm vitest run apps/web/src/app/portal/[appName]/page.test.tsx`
- [ ] `corepack pnpm vitest run apps/web/src/components/portal/dashboard-list.test.tsx`
