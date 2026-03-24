# Canvas Portal Shadcn MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable Canvas Portal with `shadcn/ui` that supports login, app switching, and dashboard management on top of the existing web and backend API routes.

**Architecture:** Add `shadcn/ui` and Tailwind foundations to `apps/web`, then rebuild the Portal around a server-first shell plus focused client components for login, app switching, selected-dashboard actions, and share management. Keep the integration boundary at `/api/canvas/*`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Vitest

---

## Chunk 1: Web UI Foundation

### Task 1: Add Tailwind and shadcn foundations

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/input.tsx`
- Create: `apps/web/src/components/ui/label.tsx`
- Create: `apps/web/src/components/ui/select.tsx`
- Create: `apps/web/src/components/ui/badge.tsx`
- Create: `apps/web/src/components/ui/separator.tsx`
- Create: `apps/web/src/components/ui/dialog.tsx`
- Test: `apps/web/src/app/layout.test.tsx`

- [ ] **Step 1: Write the failing layout/theme test**
- [ ] **Step 2: Run test to verify it fails**
Run: `corepack pnpm vitest run apps/web/src/app/layout.test.tsx`
Expected: FAIL because root layout does not load global styles or the new visual shell markers.
- [ ] **Step 3: Install Tailwind, Radix, lucide-react, class helpers, and add the minimal shadcn foundation**
- [ ] **Step 4: Run test to verify it passes**
Run: `corepack pnpm vitest run apps/web/src/app/layout.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/package.json apps/web/tsconfig.json apps/web/postcss.config.mjs apps/web/src/app/globals.css apps/web/src/lib/utils.ts apps/web/src/components/ui apps/web/src/app/layout.test.tsx
git commit -m "feat: add shadcn foundation for portal"
```

## Chunk 2: Portal Session and Shell

### Task 2: Add Portal login flow and current-session shell

**Files:**
- Create: `apps/web/src/app/portal/login/page.tsx`
- Modify: `apps/web/src/app/portal/layout.tsx`
- Modify: `apps/web/src/app/portal/page.tsx`
- Create: `apps/web/src/components/portal/login-form.tsx`
- Modify: `apps/web/src/components/portal/portal-shell.tsx`
- Modify: `apps/web/src/lib/portal/api-client.ts`
- Modify: `apps/web/src/app/api/canvas/session/route.ts`
- Test: `apps/web/src/components/portal/login-form.test.tsx`
- Test: `apps/web/src/app/portal/page.test.tsx`

- [ ] **Step 1: Write failing login and portal-shell tests**
- [ ] **Step 2: Run tests to verify failure**
Run: `corepack pnpm vitest run apps/web/src/components/portal/login-form.test.tsx apps/web/src/app/portal/page.test.tsx`
Expected: FAIL because login route and shell behavior are still placeholders.
- [ ] **Step 3: Implement login page, current-session shell, and API client session methods**
- [ ] **Step 4: Run tests to verify pass**
Run: `corepack pnpm vitest run apps/web/src/components/portal/login-form.test.tsx apps/web/src/app/portal/page.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/portal/login/page.tsx apps/web/src/app/portal/layout.tsx apps/web/src/app/portal/page.tsx apps/web/src/components/portal/login-form.tsx apps/web/src/components/portal/portal-shell.tsx apps/web/src/lib/portal/api-client.ts apps/web/src/app/api/canvas/session/route.ts apps/web/src/components/portal/login-form.test.tsx apps/web/src/app/portal/page.test.tsx
git commit -m "feat: add portal login and shell"
```

### Task 3: Add app switcher behavior

**Files:**
- Modify: `apps/web/src/components/portal/app-switcher.tsx`
- Modify: `apps/web/src/components/portal/portal-shell.tsx`
- Modify: `apps/web/src/lib/portal/api-client.ts`
- Create: `apps/web/src/components/portal/app-switcher.test.tsx`

- [ ] **Step 1: Write failing app-switcher behavior test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/web/src/components/portal/app-switcher.test.tsx`
Expected: FAIL because the switcher does not call the real app-selection path.
- [ ] **Step 3: Implement the switcher using shadcn select and the existing app-selection route**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/web/src/components/portal/app-switcher.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/portal/app-switcher.tsx apps/web/src/components/portal/portal-shell.tsx apps/web/src/lib/portal/api-client.ts apps/web/src/components/portal/app-switcher.test.tsx
git commit -m "feat: add portal app switcher behavior"
```

## Chunk 3: Dashboard Management Views

### Task 4: Rebuild dashboard list and detail pages with shadcn

**Files:**
- Modify: `apps/web/src/app/portal/dashboards/page.tsx`
- Modify: `apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
- Modify: `apps/web/src/components/portal/dashboard-list.tsx`
- Modify: `apps/web/src/components/portal/dashboard-editor.tsx`
- Modify: `apps/web/src/lib/portal/api-client.ts`
- Test: `apps/web/src/components/portal/dashboard-list.test.tsx`
- Test: `apps/web/src/components/portal/dashboard-editor.test.tsx`

- [ ] **Step 1: Write failing dashboard list/detail tests**
- [ ] **Step 2: Run tests to verify failure**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the existing views are placeholder markup.
- [ ] **Step 3: Implement server-fed dashboard pages with shadcn cards, badges, and actions**
- [ ] **Step 4: Run tests to verify pass**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/portal/dashboards/page.tsx apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx apps/web/src/components/portal/dashboard-list.tsx apps/web/src/components/portal/dashboard-editor.tsx apps/web/src/lib/portal/api-client.ts apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx
git commit -m "feat: rebuild portal dashboard views"
```

### Task 5: Add share and selected-dashboard controls

**Files:**
- Modify: `apps/web/src/components/portal/dashboard-share-panel.tsx`
- Modify: `apps/web/src/components/portal/dashboard-export-button.tsx`
- Modify: `apps/web/src/components/portal/dashboard-import-dialog.tsx`
- Modify: `apps/web/src/lib/portal/api-client.ts`
- Test: `apps/web/src/components/portal/dashboard-share-panel.test.tsx`

- [ ] **Step 1: Write failing share-panel test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-share-panel.test.tsx`
Expected: FAIL because the current panel does not expose a usable editing flow.
- [ ] **Step 3: Implement share-subject editing and selected-dashboard actions with existing routes**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-share-panel.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/portal/dashboard-share-panel.tsx apps/web/src/components/portal/dashboard-export-button.tsx apps/web/src/components/portal/dashboard-import-dialog.tsx apps/web/src/lib/portal/api-client.ts apps/web/src/components/portal/dashboard-share-panel.test.tsx
git commit -m "feat: add portal share and selection controls"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-24-canvas-portal-shadcn-mvp-plan.md`. Ready to execute?
