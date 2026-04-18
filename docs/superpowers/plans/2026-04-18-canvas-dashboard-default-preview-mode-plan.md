# Canvas Dashboard Default Preview Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dashboard detail pages open in preview mode by default and require an explicit action to enter the existing editor.

**Architecture:** Keep the existing dashboard detail route as the server entry point, but branch between a new read-only preview surface and the existing editor based on a `mode` query param. Reuse the current widget rendering path where possible, and fetch linked dataset details only for datasets used by the current dashboard so preview cards can show dataset name and source filename.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Playwright, shadcn/ui, Recharts

---

## File Structure

- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
  - Read search params, fetch linked dataset detail metadata, and switch between preview and edit surfaces.
- Create: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-preview.tsx`
  - Render the read-only dashboard preview surface and mode-switch action.
- Create: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-preview.test.tsx`
  - Cover preview rendering, dataset metadata, and empty-link fallbacks.
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-widget-card.tsx`
  - Support both read-only preview cards and edit-mode cards without leaking edit affordances into preview mode.
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-canvas.tsx`
  - Allow read-only rendering without focus handling.
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-editor.tsx`
  - Add a clear return-to-preview action for edit mode.
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/app/portal/dashboards/[dashboardId]/page.test.tsx`
  - Cover default preview mode, explicit edit mode, and linked dataset detail rendering.
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/tmp/playwright/dashboard-editor-acceptance.spec.js`
  - Update browser acceptance to enter edit mode explicitly before changing config.

## Chunk 1: Route Defaults To Preview Mode

### Task 1: Add failing route tests for preview-by-default behavior

**Files:**
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/app/portal/dashboards/[dashboardId]/page.test.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- dashboard detail renders preview mode by default
- preview mode does not show edit-only controls such as `Configure widget`
- `?mode=edit` still renders the existing editor

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run 'apps/web/src/app/portal/dashboards/[dashboardId]/page.test.tsx'`
Expected: FAIL because the route still renders `DashboardEditor` unconditionally.

- [ ] **Step 3: Implement the minimal route mode switch**

Update `page.tsx` to:
- read `searchParams`
- treat `mode=edit` as edit mode
- otherwise render the new preview surface

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run 'apps/web/src/app/portal/dashboards/[dashboardId]/page.test.tsx'`
Expected: PASS

## Chunk 2: Read-Only Preview Surface

### Task 2: Add failing component tests for dashboard preview

**Files:**
- Create: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-preview.test.tsx`
- Create: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-preview.tsx`
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-canvas.tsx`
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-widget-card.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- preview renders widget cards without edit affordances
- each linked widget shows dataset name and source filename
- missing dataset or filename shows fallback text

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-preview.test.tsx`
Expected: FAIL because the preview component does not exist yet.

- [ ] **Step 3: Implement the minimal preview surface**

Create `dashboard-preview.tsx` to:
- render a read-only dashboard canvas
- show per-widget dataset metadata links
- provide an `Edit dashboard` action

Update shared card/canvas components to:
- support read-only rendering
- suppress editing-only status markers and click handling when previewing

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-preview.test.tsx`
Expected: PASS

## Chunk 3: Edit Mode Return Path

### Task 3: Add failing tests for explicit edit-mode entry and exit

**Files:**
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-editor.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that describe:
- edit mode shows an action to return to preview mode
- the action links back to the same dashboard detail route without `mode=edit`

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the editor has no preview-return action yet.

- [ ] **Step 3: Implement the minimal edit-mode return action**

Update `dashboard-editor.tsx` to:
- accept enough route context to build a preview link
- render a small `Back to preview` or `Done` action in the editor header

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

## Chunk 4: Browser Acceptance Updates

### Task 4: Update browser acceptance for preview-first flow

**Files:**
- Modify: `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/tmp/playwright/dashboard-editor-acceptance.spec.js`

- [ ] **Step 1: Write the failing browser acceptance**

Update the acceptance to describe:
- dashboard detail opens in preview mode
- dataset metadata links are visible
- entering edit mode is required before changing chart configuration

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /tmp/canvas-pw && CANVAS_WEB_BASE_URL=http://127.0.0.1:3100 ./node_modules/.bin/playwright test dashboard-editor-acceptance.spec.js --reporter=line`
Expected: FAIL before the route and preview updates are complete.

- [ ] **Step 3: Adjust implementation until acceptance passes**

Fix any mode-switching or preview rendering gaps exposed by the browser flow.

- [ ] **Step 4: Run browser acceptance to verify it passes**

Run: `cd /tmp/canvas-pw && CANVAS_WEB_BASE_URL=http://127.0.0.1:3100 ./node_modules/.bin/playwright test dashboard-editor-acceptance.spec.js --reporter=line`
Expected: PASS

## Chunk 5: Final Verification

### Task 5: Run focused verification for preview-first dashboard detail

**Files:**
- No code changes expected

- [ ] **Step 1: Run focused automated tests**

Run: `corepack pnpm exec vitest run 'apps/web/src/app/portal/dashboards/[dashboardId]/page.test.tsx' apps/web/src/components/portal/dashboard-preview.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 2: Re-run the real-chart browser acceptance**

Run: `cd /tmp/canvas-pw && CANVAS_WEB_BASE_URL=http://127.0.0.1:3100 ./node_modules/.bin/playwright test dashboard-editor-acceptance.spec.js --reporter=line`
Expected: PASS
