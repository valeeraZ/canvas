# Canvas Redis Import Worker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn CSV dataset uploads into real asynchronous imports backed by Redis queue delivery, database job state, and a dedicated backend worker mode.

**Architecture:** Keep `import_jobs` in Postgres as the state and audit source of truth, and add a Redis list as the runtime work queue carrying only `jobId`. API mode enqueues jobs after upload, while worker mode dequeues, claims, imports, and updates dataset/job state through focused store and ingestion boundaries.

**Tech Stack:** TypeScript, Fastify, Prisma 7, Redis, PostgreSQL, Vitest, native fetch, S3-compatible object storage

---

## Chunk 1: Queue and Job State Foundations

### Task 1: Add a Redis-backed import queue contract

**Files:**
- Create: `/Users/sylvain/Work/canvas/packages/queue/src/import-job-queue.test.ts`
- Create: `/Users/sylvain/Work/canvas/packages/queue/src/import-job-queue.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/queue/src/index.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/queue/package.json`

- [ ] Step 1: Write failing tests for:
  - enqueueing a `jobId`
  - blocking dequeue returning the same `jobId`
  - namespacing the Redis key with a stable queue name
- [ ] Step 2: Run `corepack pnpm vitest run packages/queue/src/import-job-queue.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest queue wrapper that:
  - accepts a Redis client abstraction
  - writes `jobId` values to a list
  - blocks while waiting for the next `jobId`
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/queue/src/import-job-queue.test.ts` and verify pass.

### Task 2: Extend import job persistence for claim, failure, and reconciliation

**Files:**
- Create: `/Users/sylvain/Work/canvas/packages/db/src/import-job-store.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/import-job-store.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/datasets.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/index.ts`

- [ ] Step 1: Add failing store tests for:
  - claiming a `queued` job and rejecting non-queued jobs
  - marking a job `ready`
  - marking a job `failed` with warnings
  - listing stale `processing` jobs and resetting them to `queued`
- [ ] Step 2: Run `corepack pnpm vitest run packages/db/src/import-job-store.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal store helpers needed for:
  - atomic claim
  - success/failure transitions
  - stale-job reconciliation queries
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/db/src/import-job-store.test.ts` and verify pass.

### Task 3: Extend dataset persistence for worker-driven status transitions

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-store.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-store.ts`

- [ ] Step 1: Add failing dataset-store tests for:
  - moving a dataset into `processing`
  - marking a dataset `ready` while updating preview
  - marking a dataset `failed` with warnings
- [ ] Step 2: Run `corepack pnpm vitest run packages/db/src/dataset-store.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest status-update helpers required by worker execution.
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/db/src/dataset-store.test.ts` and verify pass.

## Chunk 2: Storage Read Path and Upload Enqueueing

### Task 4: Add object-read support to storage

**Files:**
- Create: `/Users/sylvain/Work/canvas/packages/storage/src/get-object.test.ts`
- Create: `/Users/sylvain/Work/canvas/packages/storage/src/get-object.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/storage/src/s3-multipart-driver.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/storage/src/index.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/storage/src/types.ts`

- [ ] Step 1: Write failing tests for reading an object body from storage through a narrow driver abstraction.
- [ ] Step 2: Run `corepack pnpm vitest run packages/storage/src/get-object.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal storage read helper and export surface needed by worker ingestion.
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/storage/src/get-object.test.ts` and verify pass.

### Task 5: Enqueue import jobs after dataset upload completes

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/routes/upload-file.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/server.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/.env.example`

- [ ] Step 1: Add failing backend tests for `PUT /datasets/uploads/:uploadId/file` that expect:
  - import job remains the database source of truth
  - queue enqueue is invoked after upload succeeds
  - queue enqueue is not invoked when upload fails
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/datasets/routes/upload-file.test.ts apps/backend/src/modules/datasets/app.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal queue-aware dataset service wiring and upload completion behavior.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/datasets/routes/upload-file.test.ts apps/backend/src/modules/datasets/app.test.ts` and verify pass.

## Chunk 3: Worker Runtime and Reconciliation

### Task 6: Introduce a dedicated backend worker mode

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/worker/runtime.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/worker/runtime.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/main.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/package.json`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/server.ts`

- [ ] Step 1: Write failing tests that describe:
  - selecting worker mode from runtime configuration
  - booting worker dependencies without starting the Fastify listener
  - graceful shutdown behavior for worker resources
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/worker/runtime.test.ts apps/backend/src/server.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest worker runtime entrypoint and config wiring needed to launch worker mode.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/worker/runtime.test.ts apps/backend/src/server.test.ts` and verify pass.

### Task 7: Add worker reconciliation and dequeue loop behavior

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/worker/queue-loop.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/worker/queue-loop.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/worker/index.ts`

- [ ] Step 1: Add failing tests for:
  - re-enqueueing queued jobs discovered during reconciliation
  - resetting stale processing jobs to queued and re-enqueueing them
  - blocking dequeue handing one `jobId` at a time to the executor
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/worker/queue-loop.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal reconciliation and queue loop orchestration.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/worker/queue-loop.test.ts` and verify pass.

## Chunk 4: CSV Import Execution

### Task 8: Upgrade the ingestion pipeline from placeholder behavior to real CSV import execution

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/parsers/csv.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/normalize/normalize-rows.ts`
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/ingestion/persist/write-normalized-table.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-preview.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-preview.ts`

- [ ] Step 1: Add failing tests for:
  - parsing CSV content from storage into headers and rows
  - normalizing headers/blank cells
  - writing normalized rows into the canonical persistence target
  - producing dataset preview records from imported CSV
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts packages/db/src/dataset-preview.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest end-to-end CSV ingestion helpers needed by worker execution.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts packages/db/src/dataset-preview.test.ts` and verify pass.

### Task 9: Execute one import job end-to-end inside worker mode

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/worker/handlers/run-import-job.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/worker/handlers/run-import-job.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/service.test.ts`

- [ ] Step 1: Add failing tests for:
  - claiming a queued job and moving dataset/job to `processing`
  - reading the CSV object from storage
  - writing preview and normalized rows
  - marking dataset/job `ready` on success
  - marking dataset/job `failed` on parse or storage error
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/modules/datasets/service.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal import executor orchestration.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/modules/datasets/service.test.ts` and verify pass.

## Chunk 5: End-to-End Verification

### Task 10: Run focused verification and build checks

**Files:**
- No code changes expected

- [ ] Step 1: Run `corepack pnpm vitest run packages/queue/src/import-job-queue.test.ts packages/db/src/import-job-store.test.ts packages/db/src/dataset-store.test.ts packages/storage/src/get-object.test.ts apps/backend/src/modules/datasets/routes/upload-file.test.ts apps/backend/src/modules/datasets/app.test.ts apps/backend/src/worker/runtime.test.ts apps/backend/src/worker/queue-loop.test.ts apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts apps/backend/src/modules/ingestion/persist/write-normalized-table.test.ts packages/db/src/dataset-preview.test.ts apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/modules/datasets/service.test.ts`
- [ ] Step 2: Run `corepack pnpm --dir apps/backend start --help` or the project-appropriate worker bootstrap command to verify runtime wiring compiles.
- [ ] Step 3: Run `corepack pnpm --dir apps/web build` to ensure Portal dataset pages still build against the updated contracts.
- [ ] Step 4: Commit once verification passes.
