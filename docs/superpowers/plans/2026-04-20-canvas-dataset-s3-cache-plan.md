# Canvas Dataset S3 Cache Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign datasets to use S3 as source of truth, store only schema/profile metadata in the database, add app-scoped dataset UX, and hydrate full dataset content on demand for widget rendering.

**Architecture:** Uploads stream to S3, background profiling stores schema metadata only, dashboard/widget reads hydrate a dataset-level parsed cache, and the portal moves datasets to app-scoped inventory/detail routes with explicit app assignment and visibility aggregation.

**Tech Stack:** Fastify, Next.js App Router, React, Vitest, Prisma, Redis, S3-compatible object storage

---

## Chunk 1: Contracts and backend dataset storage model

### Task 1: Redefine dataset preview/profile contracts away from persisted records

**Files:**
- Modify: `packages/contracts/src/dashboard-editor.ts`
- Modify: `packages/contracts/src/datasets.ts`
- Modify: related tests under `packages/contracts/src`

- [ ] **Step 1: Write the failing test**

Add tests proving dataset profile contracts describe:
- columns
- inferred types
- optional sample rows
- no required full `records` payload

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest packages/contracts/src/dashboard-editor.test.ts packages/contracts/src/charts.test.ts`
Expected: FAIL because contracts still assume full preview records.

- [ ] **Step 3: Write minimal implementation**

Update contract types and tests so widget configuration depends on schema/profile metadata, not persisted full records.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest packages/contracts/src/dashboard-editor.test.ts packages/contracts/src/charts.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/dashboard-editor.ts packages/contracts/src/datasets.ts packages/contracts/src/*.test.ts
git commit -m "refactor: redefine dataset profile contracts"
```

### Task 2: Stop persisting full dataset records in DB

**Files:**
- Modify: `packages/db/src/dataset-store.ts`
- Modify: `packages/db/src/dataset-preview.ts`
- Modify: `packages/db/src/dataset-store.test.ts`
- Modify: Prisma schema or migration files if metadata structure changes

- [ ] **Step 1: Write the failing test**

Add tests proving:
- datasets store schema/profile metadata only
- no full record array is required in the persisted preview
- status transitions still work

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest packages/db/src/dataset-store.test.ts packages/db/src/dataset-preview.test.ts`
Expected: FAIL because current store expects persisted records.

- [ ] **Step 3: Write minimal implementation**

Refactor dataset persistence so:
- schema metadata stays durable
- full records are not stored
- profile payload is normalized for widget builder needs

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest packages/db/src/dataset-store.test.ts packages/db/src/dataset-preview.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/dataset-store.ts packages/db/src/dataset-preview.ts packages/db/src/dataset-store.test.ts packages/db/src/dataset-preview.test.ts packages/db/prisma
git commit -m "refactor: store dataset schema metadata only"
```

## Chunk 2: Backend upload, profiling, inventory, and download

### Task 3: Make dataset upload app-explicit and ownership-aware

**Files:**
- Modify: `apps/backend/src/modules/datasets/app.ts`
- Modify: `apps/backend/src/modules/datasets/service.test.ts`
- Modify: `apps/backend/src/modules/datasets/app.test.ts`
- Modify: `apps/web/src/app/api/canvas/datasets/route.ts`
- Modify: `apps/web/src/app/api/canvas/datasets/route.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests proving:
- dataset upload requires `appName`
- backend rejects apps outside accessible apps or with empty roles
- uploader display name and employee id are persisted

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/backend/src/modules/datasets/app.test.ts apps/backend/src/modules/datasets/service.test.ts apps/web/src/app/api/canvas/datasets/route.test.ts`
Expected: FAIL because uploads still rely on implicit current app and do not enforce explicit app selection.

- [ ] **Step 3: Write minimal implementation**

Implement explicit app selection and uploader persistence for upload creation.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/backend/src/modules/datasets/app.test.ts apps/backend/src/modules/datasets/service.test.ts apps/web/src/app/api/canvas/datasets/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/datasets/app.ts apps/backend/src/modules/datasets/service.test.ts apps/backend/src/modules/datasets/app.test.ts apps/web/src/app/api/canvas/datasets/route.ts apps/web/src/app/api/canvas/datasets/route.test.ts
git commit -m "feat: require explicit app selection for dataset uploads"
```

### Task 4: Add profiling job and dataset inventory aggregation

**Files:**
- Modify: `apps/backend/src/modules/datasets/app.ts`
- Modify: dataset service/store files used by import/profile flow
- Modify: queue/import job files if needed
- Add tests in backend dataset modules

- [ ] **Step 1: Write the failing test**

Add tests proving:
- upload completion triggers schema/profile extraction only
- owned and shared datasets are returned in one aggregated inventory
- linked dashboard metadata is included

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/backend/src/modules/datasets/*.test.ts`
Expected: FAIL because inventory is still app-local and profile flow still assumes DB-backed full preview data.

- [ ] **Step 3: Write minimal implementation**

Implement:
- profile job state transitions
- unified dataset inventory query
- linked dashboard/uploader metadata aggregation

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/backend/src/modules/datasets/*.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/datasets apps/backend/src/modules/charts apps/backend/src/modules/ingestion packages/db/src
git commit -m "feat: add dataset inventory aggregation and schema profiling"
```

### Task 5: Add download URL endpoint

**Files:**
- Modify: `apps/backend/src/modules/datasets/app.ts`
- Add/modify corresponding route tests
- Modify web API route layer if needed

- [ ] **Step 1: Write the failing test**

Add tests proving:
- authorized users can request a short-lived download URL
- unauthorized users cannot
- no URL is stored durably in DB

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/backend/src/modules/datasets/app.test.ts`
Expected: FAIL because no download URL endpoint exists yet.

- [ ] **Step 3: Write minimal implementation**

Add an endpoint that signs a short-lived download URL on demand using dataset storage metadata.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/backend/src/modules/datasets/app.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/datasets
git commit -m "feat: add dataset download url endpoint"
```

## Chunk 3: Dataset-level cache hydration and widget reads

### Task 6: Introduce dataset-level parsed cache abstraction

**Files:**
- Create: cache service files under backend or packages
- Modify: `apps/backend/src/modules/datasets/app.ts`
- Modify: chart-query and preview-related backend paths
- Add tests for cache hits/misses/deduping

- [ ] **Step 1: Write the failing test**

Add tests proving:
- cache miss hydrates dataset from S3
- repeated widget/chart requests reuse cached parsed content
- duplicate hydrates for one dataset are deduplicated

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/backend/src/modules/datasets app/backend/src/modules/charts`
Expected: FAIL because no dataset-level parsed cache exists.

- [ ] **Step 3: Write minimal implementation**

Implement dataset parsed cache abstraction with Redis-backed storage and dataset-level keys.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/backend/src/modules/datasets apps/backend/src/modules/charts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/datasets apps/backend/src/modules/charts packages/queue packages/config
git commit -m "feat: add dataset-level parsed cache"
```

### Task 7: Rewire widget data loading to cached dataset contents

**Files:**
- Modify: backend dataset preview/chart-query routes
- Modify: web dashboard editor/preview data loading paths
- Add/update tests around widget rendering and loading states

- [ ] **Step 1: Write the failing test**

Add tests proving:
- widget rendering loads from cached dataset content
- loading state appears while hydrate is in progress
- widgets no longer require DB-persisted full dataset records

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-preview.test.tsx apps/backend/src/modules/datasets/app.test.ts`
Expected: FAIL because widget data still depends on old preview assumptions.

- [ ] **Step 3: Write minimal implementation**

Update widget-related server and client paths to rely on schema metadata for configuration and cached content for runtime rendering.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-preview.test.tsx apps/backend/src/modules/datasets/app.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal apps/web/src/lib/portal apps/backend/src/modules/datasets apps/backend/src/modules/charts
git commit -m "feat: load widget data from dataset cache"
```

## Chunk 4: Portal UX for app-scoped datasets and progress

### Task 8: Move datasets UI to app-scoped routes and explicit app selection

**Files:**
- Modify: `apps/web/src/components/portal/create-dataset-upload-dialog.tsx`
- Modify: `apps/web/src/components/portal/dataset-list.tsx`
- Modify: `apps/web/src/components/portal/dataset-detail.tsx`
- Modify: `apps/web/src/lib/portal/api-client.ts`
- Create/modify app-scoped dataset pages and tests

- [ ] **Step 1: Write the failing test**

Add tests proving:
- upload dialog lists only apps with non-empty roles
- datasets list/detail use app-scoped links
- legacy dataset routes redirect to app-scoped routes

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web/src/app/portal apps/web/src/components/portal/dataset-list.test.tsx`
Expected: FAIL because dataset UX is not fully app-scoped and upload dialog lacks explicit app selection.

- [ ] **Step 3: Write minimal implementation**

Implement app-scoped dataset routing and upload app selection UI.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web/src/app/portal apps/web/src/components/portal/dataset-list.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/portal apps/web/src/components/portal apps/web/src/lib/portal
git commit -m "feat: add app-scoped dataset routes and selection"
```

### Task 9: Add upload progress UI and global status indicator

**Files:**
- Modify: `apps/web/src/components/portal/create-dataset-upload-dialog.tsx`
- Create shared upload progress store/components as needed
- Modify portal shell or top-level layout to render global upload indicator
- Add tests for progress persistence and completion notifications

- [ ] **Step 1: Write the failing test**

Add tests proving:
- dialog shows upload progress
- progress remains visible after route changes
- ready/failed states produce visible feedback

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web/src/components/portal/create-dataset-upload-dialog.test.tsx apps/web/src/app/portal`
Expected: FAIL because upload state is currently local and non-persistent.

- [ ] **Step 3: Write minimal implementation**

Add an app-level upload progress store and top-right progress UI.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web/src/components/portal/create-dataset-upload-dialog.test.tsx apps/web/src/app/portal`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal apps/web/src/app/portal apps/web/src/lib/portal
git commit -m "feat: add persistent dataset upload progress"
```

### Task 10: Add dataset download action and widget loading indicators

**Files:**
- Modify: `apps/web/src/components/portal/dataset-list.tsx`
- Modify: `apps/web/src/components/portal/dataset-detail.tsx`
- Modify widget rendering/editor components for loading UI
- Add/update related tests

- [ ] **Step 1: Write the failing test**

Add tests proving:
- datasets expose a download action
- widget surfaces show loading while dataset hydrate is pending

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web/src/components/portal/dataset-detail.test.tsx apps/web/src/components/portal/dashboard-preview.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because these controls and loading states do not yet exist.

- [ ] **Step 3: Write minimal implementation**

Implement:
- dataset download button that fetches a short-lived URL
- widget loading UI for hydrate-in-progress states

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web/src/components/portal/dataset-detail.test.tsx apps/web/src/components/portal/dashboard-preview.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal apps/web/src/lib/portal
git commit -m "feat: add dataset download and widget loading states"
```

## Chunk 5: Verification

### Task 11: Run end-to-end targeted verification

**Files:**
- No code changes unless regressions are found

- [ ] **Step 1: Run backend verification**

Run:
- `pnpm vitest apps/backend/src/modules/datasets`
- `pnpm vitest apps/backend/src/modules/charts`
- `pnpm vitest packages/db/src/dataset-store.test.ts`

Expected: PASS

- [ ] **Step 2: Run web verification**

Run:
- `pnpm vitest apps/web/src/app/portal`
- `pnpm vitest apps/web/src/components/portal`
- `pnpm vitest apps/web/src/app/api/canvas/datasets`

Expected: PASS

- [ ] **Step 3: Run broader touched-scope regression**

Run the closest workspace command available, for example:
- `pnpm vitest apps/web apps/backend packages/auth packages/db packages/contracts`

Expected: PASS or document unrelated failures.

- [ ] **Step 4: Summarize verification**

Record:
- commands run
- any residual risks
- any cache-size or operational assumptions that still need production tuning
