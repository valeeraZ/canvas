# Canvas Portal Shadcn Console Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Portal UI as a denser shadcn-based data console without changing the existing Portal backend contract or flow.

**Architecture:** Keep the current session and dashboard APIs, but replace the Portal presentation layer with a persistent `Sidebar` shell, console-style route headers, denser dashboard management views, and more standard `shadcn/ui` composition. Use the existing web API boundary under `/api/canvas/*`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Radix UI, Vitest

---

## Chunk 1: Console Shell

### Task 1: Add real shadcn console primitives for Portal shelling

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/ui/sidebar.tsx`
- Create: `apps/web/src/components/ui/breadcrumb.tsx`
- Create: `apps/web/src/components/ui/table.tsx`
- Create: `apps/web/src/components/ui/alert.tsx`
- Create: `apps/web/src/components/ui/skeleton.tsx`
- Test: `apps/web/src/app/layout.test.tsx`

- [ ] **Step 1: Write or extend the failing shell foundation test**
- [ ] **Step 2: Run test to verify it fails**
Run: `corepack pnpm vitest run apps/web/src/app/layout.test.tsx`
Expected: FAIL because the current layout does not expose the console shell markers needed by the redesign.
- [ ] **Step 3: Add the shadcn console primitives and adjust theme tokens only as needed**
- [ ] **Step 4: Run test to verify it passes**
Run: `corepack pnpm vitest run apps/web/src/app/layout.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/globals.css apps/web/src/components/ui apps/web/src/app/layout.test.tsx
git commit -m "feat: add portal console primitives"
```

### Task 2: Rebuild Portal shell around Sidebar and Breadcrumb

**Files:**
- Modify: `apps/web/src/app/portal/layout.tsx`
- Modify: `apps/web/src/components/portal/portal-shell.tsx`
- Modify: `apps/web/src/components/portal/app-switcher.tsx`
- Modify: `apps/web/src/app/portal/page.tsx`
- Test: `apps/web/src/app/portal/page.test.tsx`
- Test: `apps/web/src/components/portal/app-switcher.test.tsx`

- [ ] **Step 1: Write failing shell and switcher tests for the Sidebar console layout**
- [ ] **Step 2: Run tests to verify they fail**
Run: `corepack pnpm vitest run apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/app-switcher.test.tsx`
Expected: FAIL because the current portal shell is page-centric and does not render console navigation.
- [ ] **Step 3: Implement Sidebar-based shell, breadcrumb header, and shell-integrated app switcher**
- [ ] **Step 4: Run tests to verify they pass**
Run: `corepack pnpm vitest run apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/app-switcher.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/portal/layout.tsx apps/web/src/components/portal/portal-shell.tsx apps/web/src/components/portal/app-switcher.tsx apps/web/src/app/portal/page.tsx apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/app-switcher.test.tsx
git commit -m "feat: rebuild portal as sidebar console"
```

## Chunk 2: Dashboard Console Views

### Task 3: Replace dashboard inventory cards with a management table

**Files:**
- Modify: `apps/web/src/app/portal/dashboards/page.tsx`
- Modify: `apps/web/src/components/portal/dashboard-list.tsx`
- Test: `apps/web/src/components/portal/dashboard-list.test.tsx`

- [ ] **Step 1: Write the failing dashboard inventory test for table-based management**
- [ ] **Step 2: Run test to verify it fails**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-list.test.tsx`
Expected: FAIL because the current dashboard list renders cards instead of a denser console inventory.
- [ ] **Step 3: Implement a shadcn table view with status, visibility summary, and actions**
- [ ] **Step 4: Run test to verify it passes**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-list.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/portal/dashboards/page.tsx apps/web/src/components/portal/dashboard-list.tsx apps/web/src/components/portal/dashboard-list.test.tsx
git commit -m "feat: add dashboard console table"
```

### Task 4: Refactor dashboard detail into console sections

**Files:**
- Modify: `apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
- Modify: `apps/web/src/components/portal/dashboard-editor.tsx`
- Modify: `apps/web/src/components/portal/dashboard-export-button.tsx`
- Modify: `apps/web/src/components/portal/dashboard-import-dialog.tsx`
- Test: `apps/web/src/components/portal/dashboard-editor.test.tsx`

- [ ] **Step 1: Write the failing dashboard detail test for tabbed or segmented console layout**
- [ ] **Step 2: Run test to verify it fails**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the current detail page is still a simple stacked form surface.
- [ ] **Step 3: Implement console-style dashboard detail sections with shadcn composition**
- [ ] **Step 4: Run test to verify it passes**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx apps/web/src/components/portal/dashboard-editor.tsx apps/web/src/components/portal/dashboard-export-button.tsx apps/web/src/components/portal/dashboard-import-dialog.tsx apps/web/src/components/portal/dashboard-editor.test.tsx
git commit -m "feat: refactor dashboard detail console"
```

## Chunk 3: Sharing and Empty States

### Task 5: Refactor sharing, states, and utility surfaces into standard shadcn composition

**Files:**
- Modify: `apps/web/src/components/portal/dashboard-share-panel.tsx`
- Modify: `apps/web/src/components/portal/login-form.tsx`
- Modify: `apps/web/src/app/portal/page.tsx`
- Modify: `apps/web/src/app/portal/dashboards/page.tsx`
- Modify: `apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
- Test: `apps/web/src/components/portal/dashboard-share-panel.test.tsx`
- Test: `apps/web/src/components/portal/login-form.test.tsx`

- [ ] **Step 1: Write the failing share/login presentation tests for the redesigned console surfaces**
- [ ] **Step 2: Run tests to verify they fail**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-share-panel.test.tsx apps/web/src/components/portal/login-form.test.tsx`
Expected: FAIL because the current forms do not use the final console-style composition and state presentation.
- [ ] **Step 3: Implement standardized share forms, alerts, empty states, and refined login surface**
- [ ] **Step 4: Run tests to verify they pass**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-share-panel.test.tsx apps/web/src/components/portal/login-form.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/portal/dashboard-share-panel.tsx apps/web/src/components/portal/login-form.tsx apps/web/src/app/portal/page.tsx apps/web/src/app/portal/dashboards/page.tsx apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx apps/web/src/components/portal/dashboard-share-panel.test.tsx apps/web/src/components/portal/login-form.test.tsx
git commit -m "feat: refine portal console interactions"
```

## Chunk 4: Verification

### Task 6: Run focused verification for Portal redesign

**Files:**
- Verify only

- [ ] **Step 1: Run focused Portal and web API tests**
Run: `corepack pnpm vitest run apps/web/src/app/layout.test.tsx apps/web/src/components/portal/login-form.test.tsx apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/app-switcher.test.tsx apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx apps/web/src/components/portal/dashboard-share-panel.test.tsx apps/web/src/app/api/canvas/session/route.test.ts apps/web/src/app/api/canvas/dashboards/route.test.ts apps/web/src/app/api/canvas/dashboards/selected-dashboard/route.test.ts 'apps/web/src/app/api/canvas/dashboards/[dashboardId]/share/route.test.ts' apps/web/src/app/api/canvas/datasets/route.test.ts`
Expected: PASS.
- [ ] **Step 2: Run production build verification**
Run: `corepack pnpm --dir apps/web build`
Expected: PASS.
- [ ] **Step 3: Commit final cleanup if needed**
```bash
git add apps/web packages/auth packages/db apps/backend
git commit -m "chore: finalize portal console redesign"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-27-canvas-portal-shadcn-console-plan.md`. Ready to execute?
