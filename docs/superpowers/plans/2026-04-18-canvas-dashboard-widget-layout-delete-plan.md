# Canvas Dashboard Widget Layout And Delete Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add layout-backed widget management to dashboard edit mode so widgets can be reordered by drag-and-drop inside the canvas and deleted directly from each widget card.

**Architecture:** Introduce a first-class widget `layout` model in contracts, persistence, and API layers, then make the editor canvas render from normalized layout order instead of raw array order. Keep phase 1 intentionally narrow with a two-column layout, dedicated layout and delete mutations, and card-level edit actions that can later grow into resize and fullscreen controls.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Fastify, Prisma, Vitest, Playwright, dnd-kit or existing lightweight drag-and-drop utility adopted by the web app

---

## File Structure

- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/widgets.ts`
  - Add the shared `DashboardWidgetLayout` type and extend `DashboardWidgetRecord` with `layout`.
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/dashboard-editor.ts`
  - Add request/response types for layout updates and widget deletion if the dashboard editor contract layer owns these inputs.
- Modify: `/Users/sylvain/Work/canvas/packages/db/prisma/schema.prisma`
  - Add persisted widget `layout` JSON storage.
- Create: `/Users/sylvain/Work/canvas/packages/db/prisma/migrations/<timestamp>_dashboard_widget_layout/migration.sql`
  - Persist the new schema change.
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.ts`
  - Centralize layout normalization, persist layout on create/update, add layout-specific update and delete operations, and compact layout after delete.
- Create: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-layout.ts`
  - Hold the shared layout normalizer, default placement helpers, and phase 1 swap/compaction utilities if the db package is the canonical layout seam.
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.test.ts`
  - Cover default layout, shared normalization, layout updates, and delete compaction.
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-repository.ts`
  - Expose any additional repository methods needed by backend routes.
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-repository.test.ts`
  - Verify repository behavior for layout and delete operations if repository tests are the established seam.
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/dashboards/routes/<widget-routes>.ts`
  - Add layout update and delete routes, following the existing dashboards route structure.
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/dashboards/routes/<widget-route-tests>.test.ts`
  - Cover valid layout patch, invalid layout patch, and delete behavior.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.ts`
  - Add client methods for widget layout updates and deletion.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.test.ts`
  - Cover new client methods and payloads.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`
  - Coordinate active widget behavior for reorder and delete, and call the new client methods.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.tsx`
  - Render widgets in layout order and host drag-and-drop behavior in edit mode.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-card.tsx`
  - Show the drag handle and delete button directly in the widget card action row.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.test.tsx`
  - Cover layout-sorted rendering and edit-only drag/delete affordances.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
  - Cover active widget behavior after delete and layout save triggers.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-preview.test.tsx`
  - Assert preview cards stay read-only after edit-mode action controls are added.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/dashboards/[dashboardId]/page.test.tsx`
  - Cover layout-aware rendering if the page test owns widget ordering expectations.
- Modify: `/Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-acceptance.spec.js`
  - Extend browser acceptance to reorder and delete widgets in edit mode.

## Chunk 1: Contract And Persistence Foundations

### Task 1: Add failing persistence tests for widget layout defaults

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/contracts/src/widgets.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.ts`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- listing widgets without stored layout returns normalized default layout
- creating a widget assigns default `{ x, y, w, h }`
- partially missing layout fields are normalized through one shared helper
- widget records now include `layout`

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts`
Expected: FAIL because widget records do not yet expose `layout`.

- [ ] **Step 3: Write minimal contract and store implementation**

Update contracts and store code to:
- define `DashboardWidgetLayout`
- include `layout` on `DashboardWidgetRecord`
- introduce one shared layout normalizer
- normalize missing layout on reads through that helper
- assign default layout on create

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts`
Expected: PASS

### Task 2: Persist layout in Prisma

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/prisma/schema.prisma`
- Create: `/Users/sylvain/Work/canvas/packages/db/prisma/migrations/<timestamp>_dashboard_widget_layout/migration.sql`

- [ ] **Step 1: Add the schema change**

Add a nullable `layout Json?` field to `DashboardWidget`.

- [ ] **Step 2: Generate the migration**

Run the project-standard Prisma migration command for the db package.
Expected: a new migration directory appears under `packages/db/prisma/migrations`.

- [ ] **Step 3: Verify schema and generated SQL**

Inspect the generated migration and confirm it adds the `layout` column without altering unrelated tables.

## Chunk 2: Store Operations For Layout Update And Delete

### Task 3: Add failing store tests for layout updates and delete compaction

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-repository.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-repository.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- updating a widget layout persists new `x` and `y`
- invalid layout values are rejected before persistence or normalized at the route boundary
- deleting a widget compacts remaining widgets into a stable two-column order
- dropping onto an occupied slot results in phase 1 `swap` semantics

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts packages/db/src/dashboard-widget-repository.test.ts`
Expected: FAIL because no layout update or delete-compaction path exists.

- [ ] **Step 3: Implement minimal store and repository methods**

Add methods to:
- update widget layout independently from config
- delete a widget by dashboard scope
- compute swap targets in layout terms for phase 1 reorder behavior
- compact remaining layouts after delete

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts packages/db/src/dashboard-widget-repository.test.ts`
Expected: PASS

## Chunk 3: Backend Routes And Client Integration

### Task 4: Add failing backend tests for widget layout and delete routes

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/dashboards/routes/<widget-route-tests>.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/dashboards/routes/<widget-routes>.ts`

- [ ] **Step 1: Identify the existing widget route files**

Locate the dashboards widget route module that currently handles list/create/update operations and note the exact files before editing the plan during implementation.

- [ ] **Step 2: Write the failing route tests**

Add tests that describe:
- `PATCH .../layout` accepts valid phase 1 layout input
- invalid layout input returns a 4xx response
- `DELETE .../widgets/:widgetId` removes the widget

- [ ] **Step 3: Run test to verify it fails**

Run the focused backend route test command for the edited dashboards route test file.
Expected: FAIL because the routes do not exist yet.

- [ ] **Step 4: Implement the minimal backend routes**

Wire the routes to the store or repository methods with validation for:
- `x` in `{0, 1}`
- `y >= 0`
- `w > 0`
- `h > 0`

Route behavior for reorder must preserve phase 1 `swap` semantics rather than silently allowing overlap or push-down packing.

- [ ] **Step 5: Run test to verify it passes**

Run the same focused backend route test command.
Expected: PASS

### Task 5: Add failing frontend client tests for layout and delete methods

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.ts`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- the portal API client sends a widget layout PATCH to the correct URL
- the client sends widget DELETE to the correct URL

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/lib/portal/api-client.test.ts`
Expected: FAIL because the client has no widget layout/delete methods.

- [ ] **Step 3: Implement the minimal client methods**

Add `updateDashboardWidgetLayout(...)` and `deleteDashboardWidget(...)` to the portal API client.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/lib/portal/api-client.test.ts`
Expected: PASS

## Chunk 4: Edit-Mode Canvas Drag And Delete UI

### Task 6: Add failing component tests for layout-sorted canvas rendering

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-card.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- widgets render in `y`, then `x` order
- edit-mode cards show a drag handle and delete button
- dragging over an occupied slot previews phase 1 swap ordering
- preview-mode cards do not show those controls

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-preview.test.tsx`
Expected: FAIL because the canvas is not layout-aware and cards have no edit actions.

- [ ] **Step 3: Implement the minimal UI**

Update the canvas and widget card to:
- sort by normalized layout
- show edit-only action controls
- prepare drag-and-drop wiring in the canvas surface
- use optimistic local reorder state during drag interactions

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-preview.test.tsx`
Expected: PASS

### Task 7: Add failing editor tests for drag-save and delete focus behavior

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- dropping a widget triggers one layout save
- failed layout saves roll the optimistic reorder back to the previous layout
- deleting the active widget moves focus to a sensible remaining widget
- deleting the last widget clears active selection

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the editor does not yet manage drag-save or delete flows.

- [ ] **Step 3: Implement the minimal editor coordination**

Update the editor to:
- apply optimistic local layout updates during drag and on drop
- call the new layout client method on drag end
- roll back optimistic layout state if the layout mutation fails
- call the delete client method after confirmation
- update local widget state and active selection deterministically

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

## Chunk 5: Browser Acceptance And Final Verification

### Task 8: Extend browser acceptance for drag reorder and delete

**Files:**
- Modify: `/Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-acceptance.spec.js`

- [ ] **Step 1: Write the failing acceptance flow**

Add browser steps that:
- open a dashboard in preview mode
- enter edit mode
- verify multiple widgets render
- drag one widget to a slot already occupied by another widget
- verify the two widgets swap positions immediately
- delete a widget from its card
- reload and confirm the resulting layout persists

- [ ] **Step 2: Run acceptance to verify it fails**

Run: `cd /tmp/canvas-pw && CANVAS_WEB_BASE_URL=http://127.0.0.1:3100 ./node_modules/.bin/playwright test dashboard-editor-acceptance.spec.js --reporter=line`
Expected: FAIL before the UI and route changes are complete.

- [ ] **Step 3: Adjust implementation until acceptance passes**

Fix any drag targeting, deletion, or persistence gaps exposed by the browser run.

- [ ] **Step 4: Run acceptance to verify it passes**

Run: `cd /tmp/canvas-pw && CANVAS_WEB_BASE_URL=http://127.0.0.1:3100 ./node_modules/.bin/playwright test dashboard-editor-acceptance.spec.js --reporter=line`
Expected: PASS

### Task 9: Run focused final verification

**Files:**
- No code changes expected

- [ ] **Step 1: Run focused automated tests**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts packages/db/src/dashboard-widget-repository.test.ts apps/web/src/lib/portal/api-client.test.ts apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-preview.test.tsx`
Expected: PASS

- [ ] **Step 2: Run focused backend route tests**

Run the focused backend dashboards widget route test command for the files edited in Chunk 3.
Expected: PASS

- [ ] **Step 3: Re-run browser acceptance**

Run: `cd /tmp/canvas-pw && CANVAS_WEB_BASE_URL=http://127.0.0.1:3100 ./node_modules/.bin/playwright test dashboard-editor-acceptance.spec.js --reporter=line`
Expected: PASS
