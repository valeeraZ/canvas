# Canvas Dashboard Distribution Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add app-scoped dashboard publication, visibility rules (user/group/role), and per-user selected dashboard persistence.

**Architecture:** Extend Prisma schema and backend modules with distribution entities and app-scoped routes. Visibility evaluation remains server-side using external role/group mappings plus persisted share rules.

**Tech Stack:** TypeScript, Prisma 7, Fastify, PostgreSQL, Vitest

---

## Chunk 1: Schema and Store Layer

### Task 1: Add distribution schema entities

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/dashboard-visibility-store.ts`
- Create: `packages/db/src/principal-app-preference-store.ts`
- Test: `packages/db/src/dashboard-visibility-store.test.ts`

- [ ] **Step 1: Write failing visibility store tests**
- [ ] **Step 2: Run tests to verify failure**
Run: `corepack pnpm vitest run packages/db/src/dashboard-visibility-store.test.ts`
Expected: FAIL due to missing models/stores.
- [ ] **Step 3: Implement schema + store mapping**
- [ ] **Step 4: Run tests to verify pass**
Run: `corepack pnpm vitest run packages/db/src/dashboard-visibility-store.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/db/prisma/schema.prisma packages/db/src/dashboard-visibility-store.ts packages/db/src/principal-app-preference-store.ts packages/db/src/dashboard-visibility-store.test.ts
git commit -m "feat: add dashboard visibility and preference stores"
```

### Task 2: Add migration and db package exports

**Files:**
- Create: `packages/db/prisma/migrations/0002_dashboard_distribution/migration.sql`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/src/principal-app-preference-store.test.ts`

- [ ] **Step 1: Write failing preference store test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run packages/db/src/principal-app-preference-store.test.ts`
Expected: FAIL because export/store is missing.
- [ ] **Step 3: Add migration and exports**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run packages/db/src/principal-app-preference-store.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/db/prisma/migrations/0002_dashboard_distribution/migration.sql packages/db/src/index.ts packages/db/src/principal-app-preference-store.test.ts
git commit -m "feat: add dashboard distribution migration and exports"
```

## Chunk 2: Fastify Routes and Visibility Evaluation

### Task 3: Add dashboard share and visibility routes

**Files:**
- Create: `apps/backend/src/modules/dashboards/routes/share-dashboard.ts`
- Modify: `apps/backend/src/modules/dashboards/app.ts`
- Test: `apps/backend/src/modules/dashboards/share-dashboard.test.ts`

- [ ] **Step 1: Write failing share-dashboard test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/backend/src/modules/dashboards/share-dashboard.test.ts`
Expected: FAIL because route is missing.
- [ ] **Step 3: Implement share route with user/group/role subjects**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/backend/src/modules/dashboards/share-dashboard.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/backend/src/modules/dashboards/routes/share-dashboard.ts apps/backend/src/modules/dashboards/app.ts apps/backend/src/modules/dashboards/share-dashboard.test.ts
git commit -m "feat: add dashboard share route for user group role subjects"
```

### Task 4: Add visible dashboards and selected-dashboard routes

**Files:**
- Create: `apps/backend/src/modules/dashboards/routes/list-visible-dashboards.ts`
- Create: `apps/backend/src/modules/dashboards/routes/set-selected-dashboard.ts`
- Modify: `apps/backend/src/modules/dashboards/app.ts`
- Test: `apps/backend/src/modules/dashboards/list-visible-dashboards.test.ts`

- [ ] **Step 1: Write failing visible-dashboards test**
- [ ] **Step 2: Run tests to verify failure**
Run: `corepack pnpm vitest run apps/backend/src/modules/dashboards/list-visible-dashboards.test.ts`
Expected: FAIL because visibility filtering route is missing.
- [ ] **Step 3: Implement visibility evaluation and selection persistence**
- [ ] **Step 4: Run tests to verify pass**
Run: `corepack pnpm vitest run apps/backend/src/modules/dashboards/list-visible-dashboards.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/backend/src/modules/dashboards/routes/list-visible-dashboards.ts apps/backend/src/modules/dashboards/routes/set-selected-dashboard.ts apps/backend/src/modules/dashboards/app.ts apps/backend/src/modules/dashboards/list-visible-dashboards.test.ts
git commit -m "feat: add visible dashboard filtering and per-user selection routes"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-22-canvas-dashboard-distribution-plan.md`. Ready to execute?
