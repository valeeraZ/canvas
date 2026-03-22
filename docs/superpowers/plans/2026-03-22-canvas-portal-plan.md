# Canvas Portal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Canvas Portal where users log in, choose an app, and manage dashboards (create/edit/share/export/import).

**Architecture:** Extend `apps/web` with a dedicated portal IA (`/portal/*`) and backend APIs under app-scoped routes. Keep embed viewer concerns out of portal modules.

**Tech Stack:** Next.js, TypeScript, Fastify, Prisma 7, Vitest, Playwright

---

## Chunk 1: Portal Shell and App Switcher

### Task 1: Add portal shell and navigation

**Files:**
- Create: `apps/web/src/app/portal/layout.tsx`
- Create: `apps/web/src/app/portal/page.tsx`
- Create: `apps/web/src/components/portal/portal-shell.tsx`
- Test: `apps/web/src/app/portal/page.test.tsx`

- [ ] **Step 1: Write failing portal shell test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/web/src/app/portal/page.test.tsx`
Expected: FAIL because portal route is missing.
- [ ] **Step 3: Implement minimal portal shell**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/web/src/app/portal/page.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/portal apps/web/src/components/portal/portal-shell.tsx apps/web/src/app/portal/page.test.tsx
git commit -m "feat: add canvas portal shell"
```

### Task 2: Add app switcher UX and active-app bootstrap

**Files:**
- Create: `apps/web/src/components/portal/app-switcher.tsx`
- Modify: `apps/web/src/components/portal/portal-shell.tsx`
- Create: `apps/web/src/lib/portal/api-client.ts`
- Test: `apps/web/src/components/portal/app-switcher.test.tsx`

- [ ] **Step 1: Write failing app-switcher test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/web/src/components/portal/app-switcher.test.tsx`
Expected: FAIL because switcher component is missing.
- [ ] **Step 3: Implement app-switcher and active-app call**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/web/src/components/portal/app-switcher.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/portal/app-switcher.tsx apps/web/src/components/portal/portal-shell.tsx apps/web/src/lib/portal/api-client.ts apps/web/src/components/portal/app-switcher.test.tsx
git commit -m "feat: add portal app switcher"
```

## Chunk 2: Dashboard Authoring and Operations

### Task 3: Add dashboard list/create/edit pages in portal

**Files:**
- Create: `apps/web/src/app/portal/dashboards/page.tsx`
- Create: `apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
- Create: `apps/web/src/components/portal/dashboard-list.tsx`
- Create: `apps/web/src/components/portal/dashboard-editor.tsx`
- Test: `apps/web/src/app/portal/dashboards/page.test.tsx`

- [ ] **Step 1: Write failing dashboards page test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/web/src/app/portal/dashboards/page.test.tsx`
Expected: FAIL because route is missing.
- [ ] **Step 3: Implement list/create/edit views with API client hooks**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/web/src/app/portal/dashboards/page.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/portal/dashboards apps/web/src/components/portal/dashboard-list.tsx apps/web/src/components/portal/dashboard-editor.tsx apps/web/src/app/portal/dashboards/page.test.tsx
git commit -m "feat: add portal dashboard management views"
```

### Task 4: Add share/export/import controls

**Files:**
- Create: `apps/web/src/components/portal/dashboard-share-panel.tsx`
- Create: `apps/web/src/components/portal/dashboard-export-button.tsx`
- Create: `apps/web/src/components/portal/dashboard-import-dialog.tsx`
- Test: `apps/web/src/components/portal/dashboard-share-panel.test.tsx`

- [ ] **Step 1: Write failing share panel test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-share-panel.test.tsx`
Expected: FAIL because panel is missing.
- [ ] **Step 3: Implement share/export/import portal controls**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/web/src/components/portal/dashboard-share-panel.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/portal/dashboard-share-panel.tsx apps/web/src/components/portal/dashboard-export-button.tsx apps/web/src/components/portal/dashboard-import-dialog.tsx apps/web/src/components/portal/dashboard-share-panel.test.tsx
git commit -m "feat: add portal dashboard share export import controls"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-22-canvas-portal-plan.md`. Ready to execute?
