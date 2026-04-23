# Prisma To Drizzle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Prisma with Drizzle using one current-state initial schema that contains only runtime-used tables and columns.

**Architecture:** `@canvas/db` will expose the same store factories, but their client dependency becomes a Drizzle-backed `DbClient` instead of `PrismaClient`. The Drizzle schema will live in `packages/db/src/schema.ts`, migrations will be squashed into a single SQL file under `packages/db/drizzle`, and Prisma generated/runtime files will be removed.

**Tech Stack:** TypeScript, Drizzle ORM, `drizzle-kit`, PostgreSQL, `pg`, Vitest.

---

## Chunk 1: Drizzle Foundation

### Task 1: Add Drizzle schema and client

**Files:**
- Modify: `packages/db/package.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/schema.ts`
- Modify: `packages/db/src/client.ts`
- Modify: `packages/db/src/client.test.ts`

- [ ] **Step 1: Write the failing client/schema test**

Add assertions that `createDbClient()` returns an object with Drizzle query surface plus `$connect` and `$disconnect` compatibility methods.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec vitest run packages/db/src/client.test.ts`
Expected: FAIL because current client is Prisma-backed and has no Drizzle schema/query contract.

- [ ] **Step 3: Install Drizzle dependencies and implement schema/client**

Replace Prisma dependencies with Drizzle dependencies, define current useful tables/columns in `schema.ts`, and implement `createDbClient()` around `drizzle-orm/node-postgres` plus `pg.Pool`.

- [ ] **Step 4: Run focused test and typecheck**

Run: `pnpm exec vitest run packages/db/src/client.test.ts`
Expected: PASS.

## Chunk 2: Store Migration

### Task 2: Move stores from Prisma calls to Drizzle queries

**Files:**
- Modify: `packages/db/src/tenant-store.ts`
- Modify: `packages/db/src/principal-store.ts`
- Modify: `packages/db/src/membership-store.ts`
- Modify: `packages/db/src/workbook-store.ts`
- Modify: `packages/db/src/dashboard-store.ts`
- Modify: `packages/db/src/dashboard-widget-store.ts`
- Modify: `packages/db/src/dashboard-visibility-store.ts`
- Modify: `packages/db/src/principal-app-preference-store.ts`
- Modify: `packages/db/src/dataset-store.ts`
- Modify: `packages/db/src/dataset-row-store.ts`
- Modify: `packages/db/src/import-job-store.ts`
- Modify: `packages/db/src/tenant-slug.ts`
- Modify matching store tests.

- [ ] **Step 1: Convert one simple store test to Drizzle-style behavior**

Start with tenant/principal store tests using a fake `DbClient` that records Drizzle calls or with pure mapper tests where possible.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec vitest run packages/db/src/tenant-store.test.ts packages/db/src/principal-store.test.ts`
Expected: FAIL because implementation still expects Prisma.

- [ ] **Step 3: Implement minimal Drizzle query helpers and migrate simple stores**

Use `insert().values().onConflictDoUpdate().returning()`, `select().from().where()`, and shared tenant slug resolution helpers.

- [ ] **Step 4: Repeat for dataset, dashboard, widget, preference, visibility, row, and import-job stores**

Each store keeps the public factory API and returned record shape unchanged.

- [ ] **Step 5: Run DB package tests**

Run: `pnpm exec vitest run packages/db/src`
Expected: PASS.

## Chunk 3: App Type Boundary And Migrations

### Task 3: Replace Prisma types in app code and squash migrations

**Files:**
- Modify: `apps/backend/src/server.ts`
- Modify: `apps/backend/src/api/app.ts`
- Modify: `apps/backend/src/modules/*/app.ts`
- Modify: `apps/backend/src/modules/session/routes/exchange-session.ts`
- Modify: `packages/db/prisma/*`
- Create: `packages/db/drizzle/0000_initial.sql`
- Modify: root/package scripts if needed.

- [ ] **Step 1: Write failing type/import check**

Run: `rg -n "Prisma|@prisma|generated/prisma|packages/db/prisma" apps packages --glob '!**/node_modules/**'`
Expected before migration: matches exist.

- [ ] **Step 2: Replace app imports with exported `DbClient` type**

Backend modules should depend on `DbClient` from `@canvas/db` or the local package source path, not Prisma generated types.

- [ ] **Step 3: Replace Prisma migration directory with one Drizzle initial SQL migration**

The migration includes only current useful tables/columns and required indexes/foreign keys.

- [ ] **Step 4: Remove Prisma generated/client artifacts and scripts**

Remove `packages/db/src/generated/prisma`, Prisma package dependencies, Prisma scripts, and the Prisma schema directory.

- [ ] **Step 5: Run global Prisma search**

Run: `rg -n "Prisma|@prisma|generated/prisma|packages/db/prisma|prisma " apps packages package.json pnpm-lock.yaml`
Expected: no runtime Prisma references.

## Chunk 4: Verification

### Task 4: Verify focused and broad tests

**Files:**
- No production edits unless failures are migration-related.

- [ ] **Step 1: Run focused DB tests**

Run: `pnpm exec vitest run packages/db/src`
Expected: PASS.

- [ ] **Step 2: Run backend tests that depend on DB types**

Run: `pnpm exec vitest run apps/backend/src`
Expected: PASS except known pre-existing failures if unrelated.

- [ ] **Step 3: Run full test suite**

Run: `pnpm exec vitest run`
Expected: only the two baseline unrelated failures may remain unless fixed separately.

- [ ] **Step 4: Check git diff**

Run: `git status --short && git diff --stat`
Expected: Prisma removed, Drizzle added, no unrelated edits.
