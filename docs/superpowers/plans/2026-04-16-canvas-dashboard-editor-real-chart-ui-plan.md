# Canvas Dashboard Editor Real Chart UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard editor render the active chart from real imported dataset rows through a dedicated chart-query API and shadcn chart UI.

**Architecture:** Keep dataset preview for configuration metadata, add a dataset-scoped chart-query read path that returns a shared chart payload, and let the active dashboard chart renderer fetch that payload on demand. Replace preview-record rendering with shadcn chart composition while intentionally limiting phase 1 to `bar`, `line`, and `area`.

**Tech Stack:** Next.js App Router, TypeScript, Fastify, Prisma 7, shadcn/ui chart, Recharts, Vitest, native fetch

---

## Chunk 1: Shared Contract and Backend Query Route

### Task 1: Define the real chart-query contract

**Files:**
- Create: `/Users/sylvain/Work/canvas/packages/contracts/src/charts.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/charts.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/index.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/charts/routes/run-chart-query.test.ts`

- [ ] **Step 1: Write failing contract and route tests**

Add tests that describe:
- a chart-query request carrying `datasetId`, `chartType`, `xField`, and `yField`
- a chart payload that keeps the existing `labels` + `series` shape
- rejection of unsupported phase-1 chart types

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run packages/contracts/src/charts.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts`
Expected: FAIL because the request contract or validation behavior does not exist yet.

- [ ] **Step 3: Write minimal shared types**

Add the smallest shared types needed, for example:
- `ChartQueryRequest`
- narrowed supported query chart type union for phase 1
- any shared payload export updates

- [ ] **Step 4: Re-run test to verify it passes**

Run: `corepack pnpm exec vitest run packages/contracts/src/charts.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts`
Expected: PASS

### Task 2: Add the backend dataset-scoped chart-query endpoint

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/api/schema.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/charts/routes/run-chart-query.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/query/lib/map-chart-payload.ts`

- [ ] **Step 1: Write the failing route test**

Add a failing backend test for `POST /datasets/:datasetId/chart-query` that expects:
- tenant-scoped access
- validation against preview fields
- `bar`, `line`, and `area` support
- a payload derived from real query rows

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/backend/src/modules/datasets/app.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts`
Expected: FAIL because the endpoint or payload mapping is incomplete.

- [ ] **Step 3: Implement the minimal backend path**

Implement:
- request/response schema entries
- dataset service read of preview columns for allowed fields
- dataset module route registration
- `runChartQuery` support for real payload mapping instead of placeholder output

- [ ] **Step 4: Re-run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/backend/src/modules/datasets/app.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/charts.ts packages/contracts/src/index.ts apps/backend/src/api/schema.ts apps/backend/src/modules/datasets/app.ts apps/backend/src/modules/datasets/app.test.ts apps/backend/src/modules/charts/routes/run-chart-query.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts apps/backend/src/modules/query/lib/map-chart-payload.ts
git commit -m "feat: add dataset chart query route"
```

## Chunk 2: Web Proxy and Portal Clients

### Task 3: Add the web proxy route for chart-query

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.ts`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/backend-client.ts`

- [ ] **Step 1: Write the failing proxy route test**

Add a failing test that expects the Next.js route to:
- require a portal session
- forward the request body to the backend
- preserve structured error behavior

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.test.ts`
Expected: FAIL because the proxy route does not exist yet.

- [ ] **Step 3: Write minimal proxy implementation**

Implement:
- `POST /api/canvas/datasets/:datasetId/chart-query`
- backend client helper that calls `/datasets/:datasetId/chart-query`
- safe JSON/error handling consistent with existing portal proxy routes

- [ ] **Step 4: Re-run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.test.ts`
Expected: PASS

### Task 4: Extend the portal API client with chart-query support

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.test.ts`

- [ ] **Step 1: Write the failing client test**

Add a failing test for a client method such as `runDatasetChartQuery()` that:
- posts chart-query input
- reads the shared chart payload
- preserves portal request-id behavior on failure

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/lib/portal/api-client.test.ts`
Expected: FAIL because the client method does not exist yet.

- [ ] **Step 3: Implement the minimal client method**

Add the request type import, the client method, and the corresponding fetch call to the new web proxy route.

- [ ] **Step 4: Re-run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/lib/portal/api-client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.ts apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.test.ts apps/web/src/lib/portal/backend-client.ts apps/web/src/lib/portal/api-client.ts apps/web/src/lib/portal/api-client.test.ts
git commit -m "feat: add portal chart query client"
```

## Chunk 3: shadcn Chart Rendering in the Editor

### Task 5: Install and verify the shadcn chart wrapper

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-chart-renderer.test.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/ui/chart.tsx`

- [ ] **Step 1: Add the failing renderer test**

Before writing the wrapper usage, add a renderer test that expects shadcn chart structure to be present in the editor chart area.

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-chart-renderer.test.tsx`
Expected: FAIL because the renderer still uses direct preview-record rendering and the shadcn wrapper is missing.

- [ ] **Step 3: Add the chart component source**

Use the shadcn CLI for the project context or copy the generated source into the expected path, then review the added file for import correctness and project alias usage.

- [ ] **Step 4: Re-run test to verify the wrapper is available**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-chart-renderer.test.tsx`
Expected: still FAIL on behavior, but no longer because `@/components/ui/chart` is missing.

### Task 6: Replace preview-record rendering with active real chart rendering

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-chart-renderer.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-chart-renderer.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/chart-adapters.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/chart-adapters.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Write the failing renderer and adapter tests**

Add failing tests that cover:
- loading state
- dataset importing state
- field not queryable state
- no rows returned state
- successful `bar`, `line`, and `area` render from real chart payload

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/chart-adapters.test.ts apps/web/src/components/portal/dashboard-chart-renderer.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the renderer still consumes `preview.records`.

- [ ] **Step 3: Implement the minimal real chart flow**

Implement:
- active-widget chart fetching through the portal API client
- payload-to-shadcn adapter logic
- shadcn chart rendering for `bar`, `line`, and `area`
- center-panel focus on the active widget instead of a preview-derived grid

- [ ] **Step 4: Re-run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/chart-adapters.test.ts apps/web/src/components/portal/dashboard-chart-renderer.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

### Task 7: Restrict unsupported controls in the config panel

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-config-panel.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`

- [ ] **Step 1: Write the failing config-panel expectation**

Add a failing test that expects:
- `pie` to be unavailable
- `seriesField` to be unavailable or marked as coming later
- valid defaults to remain for `bar`, `line`, and `area`

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because unsupported controls are still enabled.

- [ ] **Step 3: Implement the smallest UI restriction**

Update the config panel so phase-1 unsupported features are clearly deferred, without breaking saved widget editing for supported chart types.

- [ ] **Step 4: Re-run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/chart.tsx apps/web/src/components/portal/dashboard-chart-renderer.tsx apps/web/src/components/portal/dashboard-chart-renderer.test.tsx apps/web/src/components/portal/chart-adapters.ts apps/web/src/components/portal/chart-adapters.test.ts apps/web/src/components/portal/dashboard-editor.tsx apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-widget-config-panel.tsx
git commit -m "feat: render dashboard editor charts from real data"
```

## Chunk 4: Final Verification

### Task 8: Verify the full phase-1 real chart path

**Files:**
- No code changes expected

- [ ] **Step 1: Run focused automated tests**

Run: `corepack pnpm exec vitest run packages/contracts/src/charts.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts apps/backend/src/modules/datasets/app.test.ts apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.test.ts apps/web/src/lib/portal/api-client.test.ts apps/web/src/components/portal/chart-adapters.test.ts apps/web/src/components/portal/dashboard-chart-renderer.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the web build**

Run: `corepack pnpm --dir apps/web build`
Expected: PASS

- [ ] **Step 3: Run a backend smoke import**

Run: `node --import tsx -e "import('./src/main.ts').then(() => console.log('backend-main-ok'))"`
Workdir: `/Users/sylvain/Work/canvas/apps/backend`
Expected: `backend-main-ok`

- [ ] **Step 4: Commit final verification if any doc or snapshot updates are needed**

```bash
git add -A
git commit -m "chore: verify dashboard real chart ui"
```
