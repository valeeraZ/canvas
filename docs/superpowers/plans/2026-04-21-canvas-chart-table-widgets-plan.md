# Canvas Chart And Table Widgets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `pie`, `radar`, `radial`, and paginated table widgets to the dashboard editor.

**Architecture:** Extend the existing chart-query contract for additional chart renderers while preserving the label-plus-series payload. Add a separate table widget config and renderer path so table pagination does not leak into chart configuration.

**Tech Stack:** TypeScript, React 19, Next.js, Recharts, shadcn/ui table primitives, Vitest.

---

## Chunk 1: Expanded Chart Types

### Task 1: Contract And Backend Chart Support

**Files:**
- Modify: `packages/contracts/src/charts.ts`
- Modify: `packages/contracts/src/dashboard-editor.ts`
- Modify: `packages/contracts/src/charts.test.ts`
- Modify: `packages/contracts/src/dashboard-editor.test.ts`
- Modify: `apps/backend/src/modules/charts/routes/run-chart-query.ts`
- Modify: `apps/backend/src/modules/charts/routes/run-chart-query.test.ts`
- Modify: `apps/backend/src/api/schema.ts`
- Modify: `apps/web/src/lib/portal/api-client.ts`
- Modify: `apps/web/src/app/api/canvas/datasets/[datasetId]/chart-query/route.ts`

- [ ] **Step 1: Write failing contract/backend tests**

Add tests proving `pie`, `radar`, and `radial` are accepted chart query types and chart widget config types.

- [ ] **Step 2: Run tests to verify failure**

Run: `corepack pnpm exec vitest run packages/contracts/src/charts.test.ts packages/contracts/src/dashboard-editor.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts`

Expected: FAIL because the new chart types are not supported everywhere.

- [ ] **Step 3: Implement minimal chart type expansion**

Expand unions, schema enums, API client types, and backend chart type validation.

- [ ] **Step 4: Run tests to verify pass**

Run the same Vitest command. Expected: PASS.

### Task 2: Web Chart Renderer Support

**Files:**
- Modify: `apps/web/src/components/portal/dashboard-chart-renderer.tsx`
- Modify: `apps/web/src/components/portal/chart-adapters.ts`
- Modify: `apps/web/src/components/portal/dashboard-widget-config-panel.tsx`
- Modify: `apps/web/src/components/portal/dashboard-chart-renderer.test.tsx`
- Modify: `apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx`
- Modify: `apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Write failing renderer/config tests**

Add tests proving `pie`, `radar`, and `radial` render and are selectable in the config panel.

- [ ] **Step 2: Run tests to verify failure**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-chart-renderer.test.tsx apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx`

Expected: FAIL because renderer and select options are missing.

- [ ] **Step 3: Implement renderer and config options**

Add Recharts `PieChart`, `RadarChart`, and `RadialBarChart` branches and remove legacy blocking of `pie`.

- [ ] **Step 4: Run tests to verify pass**

Run the same Vitest command. Expected: PASS.

## Chunk 2: Table Widget With Pagination

### Task 3: Table Contracts And Client State

**Files:**
- Modify: `packages/contracts/src/dashboard-editor.ts`
- Modify: `packages/contracts/src/widgets.ts`
- Modify: `packages/contracts/src/dashboard-editor.test.ts`
- Modify: `apps/web/src/lib/portal/api-client.ts`
- Modify: `apps/web/src/lib/portal/api-client.test.ts`

- [ ] **Step 1: Write failing table contract/client tests**

Add tests proving table config and paginated rows payload shapes exist and the client can request table rows.

- [ ] **Step 2: Run tests to verify failure**

Run: `corepack pnpm exec vitest run packages/contracts/src/dashboard-editor.test.ts apps/web/src/lib/portal/api-client.test.ts`

Expected: FAIL because table config and client method are absent.

- [ ] **Step 3: Implement minimal table contracts and client method**

Add `TableWidgetConfig`, a widget config union, `TableRowsPayload`, and a portal client `getDatasetRowsPage` method.

- [ ] **Step 4: Run tests to verify pass**

Run the same Vitest command. Expected: PASS.

### Task 4: Table Renderer And Canvas Routing

**Files:**
- Create: `apps/web/src/components/portal/dashboard-table-renderer.tsx`
- Create: `apps/web/src/components/portal/dashboard-table-renderer.test.tsx`
- Modify: `apps/web/src/components/portal/dashboard-widget-card.tsx`
- Modify: `apps/web/src/components/portal/dashboard-canvas.tsx`
- Modify: `apps/web/src/components/portal/dashboard-editor.tsx`
- Modify: `apps/web/src/components/portal/dashboard-canvas.test.tsx`

- [ ] **Step 1: Write failing renderer/canvas tests**

Add tests proving table widgets render a table, show pagination, and chart widgets still use chart rendering.

- [ ] **Step 2: Run tests to verify failure**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-table-renderer.test.tsx apps/web/src/components/portal/dashboard-canvas.test.tsx`

Expected: FAIL because the table renderer does not exist and canvas routes all widgets through charts.

- [ ] **Step 3: Implement table renderer and widget routing**

Render shadcn table markup, pagination controls, and pass table state through dashboard editor/canvas/card.

- [ ] **Step 4: Run tests to verify pass**

Run the same Vitest command. Expected: PASS.

### Task 5: Table Config Panel

**Files:**
- Modify: `apps/web/src/components/portal/dashboard-widget-config-panel.tsx`
- Modify: `apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx`
- Modify: `apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Write failing config panel tests**

Add tests proving table widgets show dataset, visible columns, page size, and title controls.

- [ ] **Step 2: Run tests to verify failure**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx`

Expected: FAIL because the panel only supports chart config.

- [ ] **Step 3: Implement table config panel branch**

Add table-specific draft building, equality, dataset changes, page size, and column controls.

- [ ] **Step 4: Run tests to verify pass**

Run the same Vitest command. Expected: PASS.

## Chunk 3: Verification

### Task 6: Focused Regression Verification

**Files:**
- All touched files.

- [ ] **Step 1: Run focused tests**

Run: `corepack pnpm exec vitest run packages/contracts/src/charts.test.ts packages/contracts/src/dashboard-editor.test.ts apps/backend/src/modules/charts/routes/run-chart-query.test.ts apps/web/src/lib/portal/api-client.test.ts apps/web/src/components/portal/dashboard-chart-renderer.test.tsx apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx apps/web/src/components/portal/dashboard-table-renderer.test.tsx apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`

- [ ] **Step 2: Run repo test command**

Run: `corepack pnpm test`

Expected: command exits 0. Note if turbo still reports zero configured test tasks.

