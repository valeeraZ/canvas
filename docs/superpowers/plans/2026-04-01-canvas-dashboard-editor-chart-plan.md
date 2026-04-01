# Canvas Dashboard Editor Chart Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the dashboard Overview tab into a working editor that supports multiple chart widgets backed by normalized dataset previews and shadcn chart rendering.

**Architecture:** Reuse the existing app-scoped Portal and backend auth flow, add focused dashboard widget APIs, expose dataset preview metadata for editor configuration, and split the Portal editor into a widget inventory, canvas, config panel, and chart renderer. Persist chart widget configuration in `DashboardWidget.config` and adapt normalized records into shadcn chart components through a dedicated rendering layer.

**Tech Stack:** Next.js App Router, TypeScript, shadcn/ui, Fastify, Prisma 7, Vitest, native fetch

---

## Chunk 1: Contracts and Persistence Boundaries

### Task 1: Define failing tests for chart widget persistence and dataset preview contracts

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-repository.test.ts`
- Create: `/Users/sylvain/Work/canvas/packages/contracts/src/dashboard-editor.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/index.ts`

- [ ] Step 1: Add failing tests that describe:
  - a persisted chart widget config with `datasetId`, `chartType`, `xField`, `yField`, and optional `seriesField`
  - a dataset preview contract containing `columns`, `sampleRows`, and `records`
- [ ] Step 2: Run `corepack pnpm vitest run packages/db/src/dashboard-widget-repository.test.ts packages/contracts/src/dashboard-editor.test.ts` and verify the new tests fail.
- [ ] Step 3: Add the minimal shared types needed for the tests to compile and pass.
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/db/src/dashboard-widget-repository.test.ts packages/contracts/src/dashboard-editor.test.ts` and verify pass.

### Task 2: Implement minimal db helpers for widget config and dataset preview mapping

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-repository.ts`
- Create: `/Users/sylvain/Work/canvas/packages/db/src/dataset-preview.ts`
- Create: `/Users/sylvain/Work/canvas/packages/db/src/dataset-preview.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/index.ts`

- [ ] Step 1: Write failing tests for dataset preview normalization and chart widget config mapping.
- [ ] Step 2: Run `corepack pnpm vitest run packages/db/src/dataset-preview.test.ts packages/db/src/dashboard-widget-repository.test.ts` and verify failure.
- [ ] Step 3: Implement the smallest helper layer that:
  - maps raw dataset rows into normalized records
  - infers simple column types
  - returns chart widget config in a reusable record shape
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/db/src/dataset-preview.test.ts packages/db/src/dashboard-widget-repository.test.ts` and verify pass.

## Chunk 2: Backend Editor APIs

### Task 3: Add failing backend tests for dashboard widget APIs

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/dashboards/app.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/dashboards/app.ts`

- [ ] Step 1: Add failing tests for:
  - `GET /dashboards/:dashboardId/widgets`
  - `POST /dashboards/:dashboardId/widgets`
  - `PATCH /dashboards/:dashboardId/widgets/:widgetId`
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/dashboards/app.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal Fastify route behavior using the widget persistence layer.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/dashboards/app.test.ts` and verify pass.

### Task 4: Add failing backend tests for dataset preview access

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/datasets/app.ts`

- [ ] Step 1: Add failing tests for a dataset preview endpoint that returns columns, sample rows, and normalized records for the current app.
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal preview route behavior using the dataset preview helper.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts` and verify pass.

## Chunk 3: Web Proxy and API Client

### Task 5: Add failing web route tests for editor widget and preview proxying

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/dashboards/[dashboardId]/widgets/route.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/datasets/[datasetId]/preview/route.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/dashboards/[dashboardId]/widgets/[widgetId]/route.test.ts`

- [ ] Step 1: Add failing proxy tests for:
  - listing widgets
  - creating a chart widget
  - updating a widget config
  - loading dataset preview data
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/app/api/canvas/dashboards/[dashboardId]/widgets/route.test.ts apps/web/src/app/api/canvas/dashboards/[dashboardId]/widgets/[widgetId]/route.test.ts apps/web/src/app/api/canvas/datasets/[datasetId]/preview/route.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal route handlers through the Portal backend client.
- [ ] Step 4: Re-run the same test command and verify pass.

### Task 6: Extend Portal backend helpers for editor APIs

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/backend-client.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.test.ts`

- [ ] Step 1: Add failing client tests for:
  - `listDashboardWidgets`
  - `createChartWidget`
  - `updateDashboardWidget`
  - `getDatasetPreview`
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/lib/portal/api-client.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal helper methods and safe parsing behavior.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/web/src/lib/portal/api-client.test.ts` and verify pass.

## Chunk 4: Portal Dashboard Editor UI

### Task 7: Add failing component tests for the editor shell

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-list.test.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-chart-renderer.test.tsx`

- [ ] Step 1: Add failing tests that expect:
  - a widget inventory with `Add chart`
  - a canvas rendering multiple widget cards
  - a config panel with dataset, chart type, x axis, y axis, and series controls
  - a chart renderer placeholder or concrete shadcn chart output
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-widget-list.test.tsx apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx apps/web/src/components/portal/dashboard-chart-renderer.test.tsx` and verify failure.
- [ ] Step 3: Implement a split editor shell with focused components instead of keeping all editor behavior in one file.
- [ ] Step 4: Re-run the same test command and verify pass.

### Task 8: Connect the editor shell into the dashboard detail page

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] Step 1: Add or update a failing page-level test to expect live widget/editor content in `Overview`.
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx` and verify failure.
- [ ] Step 3: Wire the dashboard detail page to load widgets and dataset previews into the new editor shell.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx` and verify pass.

## Chunk 5: Chart Rendering and End-to-End Verification

### Task 9: Add failing tests for chart renderer adapters

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/chart-adapters.test.ts`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/chart-adapters.ts`

- [ ] Step 1: Add failing adapter tests for `bar`, `line`, `area`, and `pie` using the normalized records format.
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/components/portal/chart-adapters.test.ts` and verify failure.
- [ ] Step 3: Implement the minimal adapter mapping from normalized records + chart spec to renderer input.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/web/src/components/portal/chart-adapters.test.ts` and verify pass.

### Task 10: Final verification

**Files:**
- No code changes expected

- [ ] Step 1: Run `corepack pnpm vitest run packages/db/src/dashboard-widget-repository.test.ts packages/db/src/dataset-preview.test.ts apps/backend/src/modules/dashboards/app.test.ts apps/backend/src/modules/datasets/app.test.ts apps/web/src/app/api/canvas/dashboards/[dashboardId]/widgets/route.test.ts apps/web/src/app/api/canvas/dashboards/[dashboardId]/widgets/[widgetId]/route.test.ts apps/web/src/app/api/canvas/datasets/[datasetId]/preview/route.test.ts apps/web/src/lib/portal/api-client.test.ts apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-widget-list.test.tsx apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx apps/web/src/components/portal/dashboard-chart-renderer.test.tsx apps/web/src/components/portal/chart-adapters.test.ts`
- [ ] Step 2: Run `corepack pnpm --dir apps/web build`
- [ ] Step 3: Commit once verification passes
