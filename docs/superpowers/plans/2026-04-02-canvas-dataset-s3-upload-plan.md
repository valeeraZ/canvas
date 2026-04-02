# Canvas Dataset S3 Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary paste-CSV dataset flow with real file upload through Canvas backend, streaming to S3 multipart upload and persisting dataset metadata plus usage summary.

**Architecture:** Keep browsers simple: they create an upload session and then send one full file stream to Canvas backend. Backend owns upload session state, streams the request body into S3 multipart upload, persists dataset storage metadata, and exposes enriched dataset detail for Portal and editor consumers.

**Tech Stack:** Next.js App Router, TypeScript, Fastify, Prisma 7, S3-compatible object storage, Vitest, native fetch, shadcn/ui

---

## Chunk 1: Storage and Metadata Foundations

### Task 1: Define storage config and multipart service tests

**Files:**
- Create: `/Users/sylvain/Work/canvas/packages/storage/src/multipart-upload.test.ts`
- Create: `/Users/sylvain/Work/canvas/packages/storage/src/config.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/storage/src/index.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/.env.example`

- [ ] Step 1: Write failing tests for:
  - env-based storage config loading
  - multipart upload service contract (`create`, `upload part`, `complete`, `abort`)
- [ ] Step 2: Run `corepack pnpm vitest run packages/storage/src/config.test.ts packages/storage/src/multipart-upload.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal storage config reader and multipart upload service surface.
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/storage/src/config.test.ts packages/storage/src/multipart-upload.test.ts` and verify pass.
- [ ] Step 5: Commit.

### Task 2: Extend dataset persistence for stored metadata

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/prisma/schema.prisma`
- Create: `/Users/sylvain/Work/canvas/packages/db/prisma/migrations/0004_dataset_storage_metadata/migration.sql`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-store.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dataset-store.test.ts`

- [ ] Step 1: Write failing tests for dataset metadata persistence:
  - uploader identity
  - filename / content type / size
  - bucket / object key / storage upload id
  - import status
- [ ] Step 2: Run `corepack pnpm vitest run packages/db/src/dataset-store.test.ts` and verify failure.
- [ ] Step 3: Add the Prisma fields and minimal store read/write helpers.
- [ ] Step 4: Run `DATABASE_URL='<local-db-url>' corepack pnpm --dir packages/db generate` to regenerate Prisma client.
- [ ] Step 5: Re-run `corepack pnpm vitest run packages/db/src/dataset-store.test.ts` and verify pass.
- [ ] Step 6: Commit.

## Chunk 2: Backend Upload Session and File Streaming

### Task 3: Add failing backend tests for upload session creation

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.ts`
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/routes/create-upload-session.ts`

- [ ] Step 1: Add failing tests for `POST /datasets/uploads` that expect:
  - upload session id
  - dataset metadata
  - storage target metadata
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal upload session creation route and service behavior.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts` and verify pass.
- [ ] Step 5: Commit.

### Task 4: Add failing backend tests for full-file upload to S3 multipart

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/routes/upload-file.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/routes/upload-file.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.ts`

- [ ] Step 1: Write failing tests for `PUT /datasets/uploads/:uploadId/file` covering:
  - successful streaming upload
  - multipart complete
  - failure path with abort
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/datasets/routes/upload-file.test.ts` and verify failure.
- [ ] Step 3: Implement minimal route behavior using the multipart upload service.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/datasets/routes/upload-file.test.ts` and verify pass.
- [ ] Step 5: Commit.

### Task 5: Add failing backend tests for enriched dataset detail and usage metadata

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/api/schema.ts`

- [ ] Step 1: Add failing tests for dataset detail returning:
  - stored metadata
  - usage summary derived from widgets / dashboards / workbooks
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts` and verify failure.
- [ ] Step 3: Implement minimal usage summary derivation and schema updates.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts` and verify pass.
- [ ] Step 5: Commit.

## Chunk 3: Web Proxy Layer

### Task 6: Add failing web route tests for upload session and file proxying

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/datasets/route.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/datasets/[uploadId]/file/route.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/datasets/[uploadId]/file/route.ts`

- [ ] Step 1: Add failing tests for:
  - creating upload session through `/api/canvas/datasets`
  - uploading a file stream through `/api/canvas/datasets/:uploadId/file`
  - preserving `x-request-id` on success and failure
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/app/api/canvas/datasets/route.test.ts apps/web/src/app/api/canvas/datasets/[uploadId]/file/route.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal Next route proxy behavior to backend.
- [ ] Step 4: Re-run the same command and verify pass.
- [ ] Step 5: Commit.

### Task 7: Extend Portal backend/api clients for upload and dataset metadata

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/backend-client.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.test.ts`

- [ ] Step 1: Add failing client tests for:
  - creating upload session
  - uploading a file body
  - reading enriched dataset detail
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/lib/portal/api-client.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal client helpers and safe error handling.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/web/src/lib/portal/api-client.test.ts` and verify pass.
- [ ] Step 5: Commit.

## Chunk 4: Portal Upload UI and Dataset Management

### Task 8: Replace the temporary paste dialog with real file upload UI

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/create-dataset-upload-dialog.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/create-dataset-upload-dialog.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/datasets/page.tsx`

- [ ] Step 1: Add failing UI tests for:
  - selecting a file
  - showing file metadata
  - submitting upload session + file upload flow
  - showing progress / pending state
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/components/portal/create-dataset-upload-dialog.test.tsx` and verify failure.
- [ ] Step 3: Implement the minimal real file upload dialog, removing the paste-content flow.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/web/src/components/portal/create-dataset-upload-dialog.test.tsx` and verify pass.
- [ ] Step 5: Commit.

### Task 9: Surface dataset metadata and usage summary in Portal

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dataset-list.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/datasets/[datasetId]/page.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dataset-detail.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dataset-detail.test.tsx`

- [ ] Step 1: Add failing tests for rendering:
  - uploader identity
  - filename / size / content type
  - import status
  - used-by summaries
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/components/portal/dataset-list.test.tsx apps/web/src/components/portal/dataset-detail.test.tsx` and verify failure.
- [ ] Step 3: Implement the minimal dataset detail view and inventory metadata rendering.
- [ ] Step 4: Re-run the same test command and verify pass.
- [ ] Step 5: Commit.

## Chunk 5: Final Verification

### Task 10: Run focused verification and build

**Files:**
- No code changes expected

- [ ] Step 1: Run `corepack pnpm vitest run packages/storage/src/config.test.ts packages/storage/src/multipart-upload.test.ts packages/db/src/dataset-store.test.ts apps/backend/src/modules/datasets/app.test.ts apps/backend/src/modules/datasets/routes/upload-file.test.ts apps/web/src/app/api/canvas/datasets/route.test.ts apps/web/src/app/api/canvas/datasets/[uploadId]/file/route.test.ts apps/web/src/lib/portal/api-client.test.ts apps/web/src/components/portal/create-dataset-upload-dialog.test.tsx apps/web/src/components/portal/dataset-list.test.tsx apps/web/src/components/portal/dataset-detail.test.tsx`
- [ ] Step 2: Run `corepack pnpm --dir apps/web build`
- [ ] Step 3: Run any required Prisma generate/migration command for the new dataset metadata fields.
- [ ] Step 4: Commit once verification passes.
