# Canvas Dashboard Editor Multi-Widget UI Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the dashboard editor into a multi-widget canvas with focused editing and auto-save configuration flow.

**Architecture:** Keep the existing dashboard detail page data-loading shape, but move the editor center column from a single active-chart card to a multi-widget grid. Introduce focused-widget editing, widget-scoped save/query state, and grouped right-panel controls that auto-save individual widget updates without blocking the rest of the canvas.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Fastify, Vitest, Playwright, shadcn/ui, Recharts

---

## File Structure

- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`
  - Own focused-widget state, widget-scoped save/query orchestration, and top-level editor composition.
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.tsx`
  - Render the multi-widget grid and route card-selection events back to the editor.
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-card.tsx`
  - Render one widget card inside the grid with focused, saving, and query states.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-list.tsx`
  - Align left-list selection behavior and visual cues with the focused-widget model.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-config-panel.tsx`
  - Reorganize grouped fields and replace explicit save with auto-save callbacks.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-chart-renderer.tsx`
  - Support card-sized rendering and local status presentation inside multi-widget cards.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
  - Cover multi-widget grid, focus, and auto-save behavior.
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.test.tsx`
  - Focused tests for canvas selection and focused-card treatment.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx`
  - Cover grouped layout and auto-save events.
- Create: `/Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-multi-widget.spec.js`
  - Browser acceptance for multi-widget editing and auto-save flow.

## Chunk 1: Multi-Widget Canvas Shell

### Task 1: Add failing tests for the canvas overview-plus-focus model

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- the center area renders multiple widget cards at once
- one widget is visually marked as focused
- selecting a card changes the focused widget target

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the editor still renders a single active-chart card.

- [ ] **Step 3: Implement the minimal canvas components**

Create:
- `dashboard-canvas.tsx`
- `dashboard-widget-card.tsx`

Wire them into `dashboard-editor.tsx` so the center column renders all widgets in a rules-based grid and highlights the focused widget.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal/dashboard-editor.tsx apps/web/src/components/portal/dashboard-canvas.tsx apps/web/src/components/portal/dashboard-widget-card.tsx apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx
git commit -m "feat: add multi-widget dashboard canvas"
```

## Chunk 2: Right Panel Auto-Save

### Task 2: Add failing tests for grouped controls and auto-save

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-config-panel.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- grouped `Chart`, `Data`, and `Meta` sections
- chart-driving field changes trigger immediate save callbacks
- title changes use debounced save behavior
- explicit `Save widget` primary action is removed from the main flow

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the panel still uses explicit save flow.

- [ ] **Step 3: Implement the minimal auto-save panel**

Update `dashboard-widget-config-panel.tsx` to:
- render grouped sections
- emit immediate save callbacks for select fields
- debounce title changes before save
- show passive save status instead of a primary save button

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal/dashboard-widget-config-panel.tsx apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx
git commit -m "feat: auto-save dashboard widget configuration"
```

## Chunk 3: Widget-Scoped Save And Query State

### Task 3: Add failing tests for per-widget saving and chart refresh

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-chart-renderer.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-list.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- only the changed widget enters saving state
- only the changed widget refreshes its chart query
- switching focus between list and canvas cards targets the same widget

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because save/query state is still effectively editor-global.

- [ ] **Step 3: Implement the minimal widget-scoped orchestration**

Update `dashboard-editor.tsx` to:
- track per-widget save state
- track per-widget chart state
- keep focus changes independent from other widgets

Update `dashboard-chart-renderer.tsx` and `dashboard-widget-list.tsx` so local saving and status cues match the new state model.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal/dashboard-editor.tsx apps/web/src/components/portal/dashboard-chart-renderer.tsx apps/web/src/components/portal/dashboard-widget-list.tsx apps/web/src/components/portal/dashboard-editor.test.tsx
git commit -m "feat: scope dashboard widget save and chart states"
```

## Chunk 4: Browser Acceptance

### Task 4: Add and run browser acceptance for multi-widget editing

**Files:**
- Create: `/Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-multi-widget.spec.js`

- [ ] **Step 1: Write the failing browser acceptance**

Add a Playwright acceptance that covers:
- logging in to the portal
- opening a dashboard with multiple widgets
- seeing multiple widget cards at once
- changing focus by clicking a card
- auto-saving a field change and observing chart refresh on the correct widget

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /tmp/canvas-pw && ./node_modules/.bin/playwright test /Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-multi-widget.spec.js --reporter=line`
Expected: FAIL before the UI implementation is complete.

- [ ] **Step 3: Adjust implementation until acceptance passes**

Do not add browser-only hacks. Fix actual widget focus, save state, or rendering gaps exposed by the acceptance.

- [ ] **Step 4: Run browser acceptance to verify it passes**

Run: `cd /tmp/canvas-pw && ./node_modules/.bin/playwright test /Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-multi-widget.spec.js --reporter=line`
Expected: PASS

## Chunk 5: Final Verification

### Task 5: Run focused verification for the polished editor

**Files:**
- No code changes expected

- [ ] **Step 1: Run focused automated tests**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-widget-config-panel.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-chart-renderer.test.tsx`
Expected: PASS

- [ ] **Step 2: Re-run the existing real-chart browser acceptance**

Run: `cd /tmp/canvas-pw && ./node_modules/.bin/playwright test /Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-acceptance.spec.js --reporter=line`
Expected: PASS

- [ ] **Step 3: Re-run the multi-widget browser acceptance**

Run: `cd /tmp/canvas-pw && ./node_modules/.bin/playwright test /Users/sylvain/Work/canvas/tmp/playwright/dashboard-editor-multi-widget.spec.js --reporter=line`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/portal docs/superpowers/specs/2026-04-17-canvas-dashboard-editor-multi-widget-ui-polish-design.md docs/superpowers/plans/2026-04-17-canvas-dashboard-editor-multi-widget-ui-polish-plan.md
git commit -m "feat: polish dashboard editor multi-widget ui"
```
