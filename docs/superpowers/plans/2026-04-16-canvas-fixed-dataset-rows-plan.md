# Canvas Fixed Dataset Rows Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rejected dynamic-table import path with a fixed `DatasetRow` table, typed JSON row persistence, and `datasetId`-scoped query execution.

**Architecture:** Keep Redis queueing and worker execution as already designed, but persist imported CSV data into a shared `DatasetRow` table keyed by tenant and dataset. Query contracts move from `tableName` to `datasetId`, and SQL is generated against the fixed row table using validated JSON field access.

**Tech Stack:** TypeScript, Fastify, Prisma 7, Redis, PostgreSQL, JSONB, Vitest, Next.js

---

## Chunk 1: Replace Dynamic Storage With Fixed Dataset Rows

### Task 1: Add `DatasetRow` to Prisma and DB helpers

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/prisma/schema.prisma`
- Create: `/Users/sylvain/Work/canvas/packages/db/prisma/migrations/0006_dataset_rows/migration.sql`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/index.ts`
- Create: `/Users/sylvain/Work/canvas/packages/db/src/dataset-row-store.test.ts`
- Create: `/Users/sylvain/Work/canvas/packages/db/src/dataset-row-store.ts`

- [ ] Step 1: Write failing tests for replacing all rows of one dataset and listing rows in `rowIndex` order.
- [ ] Step 2: Run `corepack pnpm vitest run packages/db/src/dataset-row-store.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest `DatasetRow` store with:
  - transactional delete-and-reinsert for one dataset
  - ordered row listing for query/runtime tests
- [ ] Step 4: Run `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm --dir packages/db generate`.
- [ ] Step 5: Re-run `corepack pnpm vitest run packages/db/src/dataset-row-store.test.ts` and verify pass.
- [ ] Step 6: Commit the persistence layer checkpoint.

### Task 2: Replace dynamic table persistence with fixed-row writes

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/persist/write-normalized-table.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/worker/index.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/worker/index.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/main.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/main.ts`

- [ ] Step 1: Rewrite the persistence tests so they fail unless imports replace rows in `DatasetRow` instead of emitting `DROP/CREATE TABLE` SQL.
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts apps/backend/src/worker/index.test.ts apps/backend/src/main.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal persistence adapter that delegates to the `DatasetRow` store.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts apps/backend/src/worker/index.test.ts apps/backend/src/main.test.ts` and verify pass.
- [ ] Step 5: Commit the fixed-row persistence checkpoint.

## Chunk 2: Typed JSON Normalization And Preview Consistency

### Task 3: Normalize imported rows into typed JSON-ready records

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/normalize/normalize-rows.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-preview.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-preview.ts`

- [ ] Step 1: Add failing tests for boolean, numeric, null, and date-like value normalization into JSON-ready records.
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts packages/db/src/dataset-preview.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest typed normalization helpers needed by both persistence and preview generation.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts packages/db/src/dataset-preview.test.ts` and verify pass.

### Task 4: Ensure worker execution writes typed rows and keeps preview intact

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/worker/handlers/run-import-job.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/worker/handlers/run-import-job.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/service.test.ts`

- [ ] Step 1: Add failing tests for:
  - successful import writing typed JSON row values
  - re-import replacing previous dataset rows
  - preview remaining compatible with existing consumers
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/modules/datasets/service.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal worker/import changes needed to persist typed rows and preserve preview.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/modules/datasets/service.test.ts` and verify pass.
- [ ] Step 5: Commit the ingestion checkpoint.

## Chunk 3: Move Queries From `tableName` To `datasetId`

### Task 5: Update query contracts and SQL builder for fixed-table reads

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/query.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/index.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/query/lib/build-sql.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/query/lib/build-sql.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/query/routes/run-query.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/charts/routes/run-chart-query.ts`

- [ ] Step 1: Add failing tests for SQL generation that targets the fixed `DatasetRow` table using `datasetId`, one dimension, and `count`/`sum`/`avg`.
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/query/lib/build-sql.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest contract and SQL builder changes needed to remove `tableName`.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/query/lib/build-sql.test.ts` and verify pass.

### Task 6: Execute fixed-table queries against real row data

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/modules/query/routes/run-query.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/query/routes/run-query.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/charts/routes/run-chart-query.test.ts`

- [ ] Step 1: Add failing tests for grouped aggregates over `DatasetRow.record` with validated field names.
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/query/routes/run-query.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal query execution path using Prisma raw SQL or equivalent fixed-table access.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/query/routes/run-query.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts` and verify pass.
- [ ] Step 5: Commit the query checkpoint.

## Chunk 4: End-to-End Verification

### Task 7: Run focused verification and build checks

**Files:**
- No code changes expected

- [ ] Step 1: Run `corepack pnpm vitest run packages/queue/src/client.test.ts packages/queue/src/import-job-queue.test.ts packages/db/src/import-job-store.test.ts packages/db/src/dataset-store.test.ts packages/db/src/dataset-row-store.test.ts packages/db/src/dataset-preview.test.ts packages/storage/src/get-object.test.ts packages/storage/src/s3-multipart-driver.test.ts apps/backend/src/modules/datasets/service.test.ts apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts apps/backend/src/worker/runtime.test.ts apps/backend/src/worker/queue-loop.test.ts apps/backend/src/worker/index.test.ts apps/backend/src/main.test.ts apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/modules/query/lib/build-sql.test.ts apps/backend/src/modules/query/routes/run-query.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts apps/backend/src/server.test.ts`
- [ ] Step 2: Run `node --import tsx -e "import('./src/main.ts').then(() => console.log('backend-main-ok'))"` in `/Users/sylvain/Work/canvas/apps/backend`.
- [ ] Step 3: Run `corepack pnpm --dir apps/web build`.
- [ ] Step 4: Commit once verification passes.
