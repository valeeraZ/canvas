# Dataset Upload Profiling Progress Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace row-import behavior with schema-only profiling and show dataset upload/profiling progress globally in the portal.

**Architecture:** Keep S3 as the source of truth and keep the async job boundary, but change the worker from importing rows to profiling metadata only. The web app stores upload tasks in a portal-level client provider that displays upload byte progress and polls dataset status until ready or failed.

**Tech Stack:** Fastify, Prisma stores, Redis-backed job queue, S3 multipart upload service, Next.js App Router, React client components, Vitest.

---

## Chunk 1: Backend Profiling Semantics

### Task 1: Stop Worker Row Persistence

**Files:**
- Modify: `apps/backend/src/worker/handlers/run-import-job.test.ts`
- Modify: `apps/backend/src/worker/handlers/run-import-job.ts`
- Modify: `apps/backend/src/worker/index.test.ts`
- Modify: `apps/backend/src/worker/index.ts`
- Modify: `apps/backend/src/main.test.ts`
- Modify: `apps/backend/src/main.ts`

- [ ] **Step 1: Write failing tests**
  - Update `run-import-job.test.ts` to assert no `persistNormalizedTable` call is required and worker still marks dataset ready with preview.
  - Update worker index/main tests so `createDatasetRowStore` is not required for worker runtime.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `pnpm vitest apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/worker/index.test.ts apps/backend/src/main.test.ts`
  - Expected: failures show old row persistence dependency.

- [ ] **Step 3: Implement minimal backend change**
  - Remove `persistNormalizedTable` from `runImportJob`.
  - Remove `datasetRows` and `writeNormalizedTable` wiring from worker executor.
  - Remove `createDatasetRowStore` from worker mode setup.

- [ ] **Step 4: Verify**
  - Re-run the same tests.
  - Expected: pass.

### Task 2: Use Profiling Status After Upload

**Files:**
- Modify: `apps/backend/src/modules/datasets/app.test.ts`
- Modify: `apps/backend/src/modules/datasets/app.ts`
- Modify: `packages/contracts/src/datasets.ts`
- Modify: `packages/db/src/dataset-store.test.ts`
- Modify: `packages/db/src/dataset-store.ts`

- [ ] **Step 1: Write failing tests**
  - Assert `uploadFile()` returns `importStatus: "profiling"` after S3 upload completes.
  - Assert dataset storage metadata update writes `status/importStatus` as `profiling`.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `pnpm vitest apps/backend/src/modules/datasets/app.test.ts packages/db/src/dataset-store.test.ts`
  - Expected: old `"queued"` expectations fail.

- [ ] **Step 3: Implement status transition**
  - Add `profiling` to `DatasetStatus`.
  - Update dataset storage metadata helper to optionally update `status`.
  - Set dataset `status` and `importStatus` to `profiling` after upload completes.

- [ ] **Step 4: Verify**
  - Re-run backend dataset tests.
  - Expected: pass.

## Chunk 2: Portal Upload Progress

### Task 3: Add Upload Progress API Client

**Files:**
- Modify: `apps/web/src/lib/portal/api-client.test.ts`
- Modify: `apps/web/src/lib/portal/api-client.ts`

- [ ] **Step 1: Write failing tests**
  - Add a test for `uploadDatasetFile({ onProgress })` calling progress callbacks and resolving upload result.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `pnpm vitest apps/web/src/lib/portal/api-client.test.ts -t upload`

- [ ] **Step 3: Implement XHR upload helper**
  - Use `XMLHttpRequest` for browser uploads when `onProgress` is provided.
  - Keep existing fetch fallback for server/test environments.

- [ ] **Step 4: Verify**
  - Re-run the API client upload tests.

### Task 4: Add Global Upload Provider and Indicator

**Files:**
- Create: `apps/web/src/components/portal/dataset-upload-progress-provider.tsx`
- Modify: `apps/web/src/components/portal/create-dataset-upload-dialog.test.tsx`
- Modify: `apps/web/src/components/portal/create-dataset-upload-dialog.tsx`
- Modify: `apps/web/src/components/portal/portal-shell.tsx`

- [ ] **Step 1: Write failing component tests**
  - Assert the provider renders an upload item with percent/profiling/ready states.
  - Assert upload dialog uses provider `startUpload`.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `pnpm vitest apps/web/src/components/portal`

- [ ] **Step 3: Implement provider**
  - Store tasks in React state at portal shell level.
  - Update byte progress from `uploadDatasetFile`.
  - Poll `getDataset()` every 2-3 seconds while pending.
  - Show ready/failed toast-card in the top-right.

- [ ] **Step 4: Verify**
  - Re-run component tests.

## Chunk 3: Integration Verification

### Task 5: Focused Regression Run

**Files:**
- No new files.

- [ ] **Step 1: Run backend worker/dataset tests**
  - Run: `pnpm vitest apps/backend/src/worker/handlers/run-import-job.test.ts apps/backend/src/worker/index.test.ts apps/backend/src/main.test.ts apps/backend/src/modules/datasets/app.test.ts packages/db/src/dataset-store.test.ts`

- [ ] **Step 2: Run web upload/dataset tests**
  - Run: `pnpm vitest apps/web/src/lib/portal/api-client.test.ts apps/web/src/components/portal apps/web/src/app/api/canvas/datasets/route.test.ts 'apps/web/src/app/api/canvas/datasets/uploads/[uploadId]/file/route.test.ts'`

- [ ] **Step 3: Report status**
  - Summarize completed changes, commands run, and remaining risks.
