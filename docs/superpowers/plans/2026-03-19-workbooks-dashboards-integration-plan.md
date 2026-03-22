# Workbooks Dashboards Integration Test Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real PostgreSQL-backed Fastify integration tests for workbook and dashboard routes.

**Architecture:** Reuse the gated `DATABASE_URL` integration pattern already established for datasets. Each test will stand up a real Prisma client and Fastify app, seed a tenant, exercise HTTP routes through `inject`, and clean up persisted rows afterward.

**Tech Stack:** TypeScript, Fastify, Prisma 7, PostgreSQL, Vitest

---

## Chunk 1: Workbook Integration Test

### Task 1: Add real workbook route integration coverage

**Files:**
- Create: `apps/backend/src/modules/workbooks/app.integration.test.ts`

- [ ] **Step 1: Write the failing workbook integration test**

Create a gated integration test that:

- creates a workbook via `POST /workbooks`
- lists workbooks via `GET /workbooks`
- fetches a workbook via `GET /workbooks/:workbookId`

- [ ] **Step 2: Run test to verify it fails**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run apps/backend/src/modules/workbooks/app.integration.test.ts`
Expected: FAIL until the integration test and fixture setup are correct.

- [ ] **Step 3: Implement the minimal fixture setup**

Seed the tenant in `beforeAll`, clean workbook rows in `afterAll`, and close the Fastify app and Prisma client.

- [ ] **Step 4: Run test to verify it passes**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run apps/backend/src/modules/workbooks/app.integration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/workbooks/app.integration.test.ts
git commit -m "test: add workbook db integration coverage"
```

## Chunk 2: Dashboard Integration Test

### Task 2: Add real dashboard route integration coverage

**Files:**
- Create: `apps/backend/src/modules/dashboards/app.integration.test.ts`

- [ ] **Step 1: Write the failing dashboard integration test**

Create a gated integration test that:

- creates a prerequisite workbook row
- creates a dashboard via `POST /dashboards`
- lists dashboards via `GET /dashboards`
- fetches a dashboard via `GET /dashboards/:dashboardId`

- [ ] **Step 2: Run test to verify it fails**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run apps/backend/src/modules/dashboards/app.integration.test.ts`
Expected: FAIL until the fixture setup is correct.

- [ ] **Step 3: Implement the minimal fixture setup**

Seed the tenant, create the prerequisite workbook, clean dashboards and workbooks in `afterAll`, and close the Fastify app and Prisma client.

- [ ] **Step 4: Run test to verify it passes**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run apps/backend/src/modules/dashboards/app.integration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/dashboards/app.integration.test.ts
git commit -m "test: add dashboard db integration coverage"
```

## Chunk 3: Verification

### Task 3: Verify local runtime coverage

**Files:**
- Verify only

- [ ] **Step 1: Run focused integration verification**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run apps/backend/src/modules/workbooks/app.integration.test.ts apps/backend/src/modules/dashboards/app.integration.test.ts`
Expected: PASS.

- [ ] **Step 2: Run full regression with database**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run`
Expected: PASS.

- [ ] **Step 3: Summarize readiness**

Confirm that datasets, workbooks, and dashboards all have real Fastify plus Prisma integration coverage against the local PostgreSQL workflow.

Plan complete and saved to `docs/superpowers/plans/2026-03-19-workbooks-dashboards-integration-plan.md`. Ready to execute?
