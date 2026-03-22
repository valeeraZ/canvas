# Workbooks Dashboards Fastify Prisma Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect workbook and dashboard resource routes to Fastify and Prisma-backed persistence.

**Architecture:** Add focused Prisma store files for workbooks and dashboards, then expose Fastify plugins for create, list, and detail endpoints. Extend the existing API app factory so these modules can run either with a real Prisma client or with stubbed services in tests.

**Tech Stack:** TypeScript, Fastify, Prisma 7, PostgreSQL, Vitest

---

## Chunk 1: Prisma Stores

### Task 1: Add workbook and dashboard stores

**Files:**
- Create: `packages/db/src/workbook-store.ts`
- Create: `packages/db/src/dashboard-store.ts`
- Create: `packages/db/src/workbook-store.test.ts`
- Create: `packages/db/src/dashboard-store.test.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Write the failing store tests**

```ts
import { describe, expect, it } from "vitest";
import { toWorkbookRecord } from "./workbook-store";

describe("toWorkbookRecord", () => {
  it("normalizes a persisted workbook", () => {
    const workbook = toWorkbookRecord({
      id: "wb_1",
      tenantId: "tenant_demo",
      name: "Sales Workbook"
    });

    expect(workbook.name).toBe("Sales Workbook");
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { toDashboardRecord } from "./dashboard-store";

describe("toDashboardRecord", () => {
  it("normalizes a persisted dashboard", () => {
    const dashboard = toDashboardRecord({
      id: "dash_1",
      tenantId: "tenant_demo",
      name: "Overview",
      workbookId: "wb_1"
    });

    expect(dashboard.workbookId).toBe("wb_1");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm vitest run packages/db/src/workbook-store.test.ts packages/db/src/dashboard-store.test.ts`
Expected: FAIL because the store files are missing.

- [ ] **Step 3: Implement the Prisma stores**

Implement `create`, `listByTenant`, and `findByTenantAndId` for both resources.

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm vitest run packages/db/src/workbook-store.test.ts packages/db/src/dashboard-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/workbook-store.ts packages/db/src/dashboard-store.ts packages/db/src/workbook-store.test.ts packages/db/src/dashboard-store.test.ts packages/db/src/index.ts
git commit -m "feat: add prisma workbook and dashboard stores"
```

## Chunk 2: Fastify Route Modules

### Task 2: Add workbook and dashboard Fastify plugins

**Files:**
- Create: `apps/backend/src/modules/workbooks/app.ts`
- Create: `apps/backend/src/modules/workbooks/app.test.ts`
- Create: `apps/backend/src/modules/dashboards/app.ts`
- Create: `apps/backend/src/modules/dashboards/app.test.ts`
- Modify: `apps/backend/src/api/app.ts`

- [ ] **Step 1: Write the failing Fastify route tests**

Create one test for workbooks and one for dashboards using `createApiApp()` with stubbed services, covering `GET`, `POST`, and `GET by id`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm vitest run apps/backend/src/modules/workbooks/app.test.ts apps/backend/src/modules/dashboards/app.test.ts`
Expected: FAIL because the Fastify plugins are missing.

- [ ] **Step 3: Implement the plugins and mount them**

Register:

- `GET /workbooks`
- `POST /workbooks`
- `GET /workbooks/:workbookId`
- `GET /dashboards`
- `POST /dashboards`
- `GET /dashboards/:dashboardId`

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm vitest run apps/backend/src/modules/workbooks/app.test.ts apps/backend/src/modules/dashboards/app.test.ts apps/backend/src/api/app.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/workbooks/app.ts apps/backend/src/modules/workbooks/app.test.ts apps/backend/src/modules/dashboards/app.ts apps/backend/src/modules/dashboards/app.test.ts apps/backend/src/api/app.ts
git commit -m "feat: add fastify workbook and dashboard routes"
```

## Chunk 3: Verification

### Task 3: Verify route integration

**Files:**
- Verify only

- [ ] **Step 1: Run focused tests**

Run: `corepack pnpm vitest run packages/db/src/workbook-store.test.ts packages/db/src/dashboard-store.test.ts apps/backend/src/modules/workbooks/app.test.ts apps/backend/src/modules/dashboards/app.test.ts apps/backend/src/api/app.test.ts`
Expected: PASS.

- [ ] **Step 2: Run full regression**

Run: `corepack pnpm vitest run`
Expected: PASS.

- [ ] **Step 3: Summarize readiness**

Confirm that workbook and dashboard create/list/detail routes now run through Fastify and Prisma-backed store layers.

Plan complete and saved to `docs/superpowers/plans/2026-03-19-workbooks-dashboards-fastify-prisma-plan.md`. Ready to execute?
