# Canvas Auth App Routing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock/session-selected app navigation with auth-backed app inventory, app-scoped portal URLs, and workbook-free portal UX.

**Architecture:** Keep Canvas backend as the auth BFF. The backend resolves principal, accessible apps, and app metadata from the auth API, then the web portal consumes backend responses and routes app/dashboard pages by URL param instead of select-app session state.

**Tech Stack:** Fastify, Next.js App Router, React, Vitest, TypeScript, Prisma-backed services

---

## Chunk 1: Auth API alignment and backend inventory

### Task 1: Fix auth package contracts against the real auth API

**Files:**
- Modify: `packages/auth/src/authorization-api.ts`
- Modify: `packages/auth/src/authorization-api.test.ts`

- [ ] **Step 1: Write the failing tests**

Add tests that prove:
- `fetchAccessibleApps()` accepts the real `/v1/authorization/roles` payload shape
- app roles for a requested app are resolved from that list instead of calling a missing `/roles/{app}`
- app metadata is fetched from `/v1/app/{app_id}`

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest packages/auth/src/authorization-api.test.ts`
Expected: FAIL because the current implementation expects the wrong auth routes/payloads and has no app metadata fetcher.

- [ ] **Step 3: Write minimal implementation**

Update the auth package to:
- parse both `app_name` and `appName` defensively where useful
- resolve requested app roles from the accessible apps list
- export a new app metadata fetcher/type for backend aggregation

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest packages/auth/src/authorization-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/auth/src/authorization-api.ts packages/auth/src/authorization-api.test.ts
git commit -m "feat: align auth client with app metadata api"
```

### Task 2: Add backend app inventory coverage

**Files:**
- Modify: `apps/backend/src/modules/auth/app.ts`
- Modify: `apps/backend/src/modules/auth/app.test.ts`
- Modify: `apps/backend/src/api/app.ts`
- Modify: `apps/backend/src/server.ts`

- [ ] **Step 1: Write the failing tests**

Add tests that prove:
- `/auth/apps` returns principal plus app display metadata
- backend no longer depends on mock-only app switching for overview inventory
- unauthorized app resolution is rejected when the requested app is not in accessible apps

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/backend/src/modules/auth/app.test.ts`
Expected: FAIL because the response schema and authorization behavior do not yet match the new inventory model.

- [ ] **Step 3: Write minimal implementation**

Implement backend auth changes:
- extend `/auth/apps`
- introduce explicit app authorization helper(s)
- default backend auth base URL to `http://localhost:8000`
- stop treating mock auth as the default runtime path

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/backend/src/modules/auth/app.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/auth/app.ts apps/backend/src/modules/auth/app.test.ts apps/backend/src/api/app.ts apps/backend/src/server.ts
git commit -m "feat: add auth-backed app inventory"
```

## Chunk 2: Portal route model and overview

### Task 3: Convert overview to app-card navigation without workbooks

**Files:**
- Modify: `apps/web/src/app/portal/page.tsx`
- Modify: `apps/web/src/app/portal/page.test.tsx`
- Modify: `apps/web/src/components/portal/app-inventory.tsx`
- Modify: `apps/web/src/components/portal/portal-shell.tsx`
- Modify: `apps/web/src/components/portal/app-switcher.tsx`
- Modify: `apps/web/src/lib/portal/backend-client.ts`
- Modify: `apps/web/src/lib/portal/session.ts`

- [ ] **Step 1: Write the failing tests**

Add tests that prove:
- overview renders app display name and latest dashboard summary
- workbook copy is removed
- clicking/opening an app uses a direct link to `/portal/[appName]`
- portal shell no longer renders workbook navigation

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/app-switcher.test.tsx`
Expected: FAIL because the UI still references workbooks and select-app behavior.

- [ ] **Step 3: Write minimal implementation**

Refactor overview and shell:
- consume aggregated inventory from backend
- map Lucide icon names safely
- remove workbook sections and navigation
- preserve recent activity only for app ordering if still useful

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/app-switcher.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/portal/page.tsx apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/app-inventory.tsx apps/web/src/components/portal/portal-shell.tsx apps/web/src/components/portal/app-switcher.tsx apps/web/src/lib/portal/backend-client.ts apps/web/src/lib/portal/session.ts
git commit -m "feat: route portal overview by app inventory"
```

### Task 4: Introduce app-scoped portal routes

**Files:**
- Create: `apps/web/src/app/portal/[appName]/page.tsx`
- Create: `apps/web/src/app/portal/[appName]/page.test.tsx`
- Create: `apps/web/src/app/portal/[appName]/[dashboardId]/page.tsx`
- Create: `apps/web/src/app/portal/[appName]/[dashboardId]/page.test.tsx`
- Modify: `apps/web/src/app/portal/dashboards/page.tsx`
- Modify: `apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`

- [ ] **Step 1: Write the failing tests**

Add tests that prove:
- `/portal/[appName]` shows dashboards for that app
- `/portal/[appName]/[dashboardId]` loads the dashboard detail/editor
- breadcrumbs include app display name and dashboard name
- old dashboard routes redirect or stop serving primary navigation

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest 'apps/web/src/app/portal/[appName]/page.test.tsx' 'apps/web/src/app/portal/[appName]/[dashboardId]/page.test.tsx'`
Expected: FAIL because the routes do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement app-scoped routes and wire backend fetches to explicit `appName` params. Preserve viewer/editor mode support and remove dependence on `selectedApp` for route resolution.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest 'apps/web/src/app/portal/[appName]/page.test.tsx' 'apps/web/src/app/portal/[appName]/[dashboardId]/page.test.tsx'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/portal/[appName]/page.tsx apps/web/src/app/portal/[appName]/page.test.tsx apps/web/src/app/portal/[appName]/[dashboardId]/page.tsx apps/web/src/app/portal/[appName]/[dashboardId]/page.test.tsx apps/web/src/app/portal/dashboards/page.tsx apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx
git commit -m "feat: add app-scoped portal routes"
```

## Chunk 3: Verification and regression cleanup

### Task 5: Remove workbook-facing portal remnants and validate regressions

**Files:**
- Modify: `apps/web/src/components/portal/create-dashboard-dialog.tsx`
- Modify: `apps/web/src/components/portal/dashboard-list.tsx`
- Modify: any remaining portal files found by `rg "workbook" apps/web/src/app/portal apps/web/src/components/portal apps/web/src/lib/portal`

- [ ] **Step 1: Write the failing tests**

Add or adjust tests proving no workbook management copy remains in the portal app overview and dashboard navigation surfaces that changed in this feature.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/app/portal/page.test.tsx`
Expected: FAIL if workbook-specific expectations still exist.

- [ ] **Step 3: Write minimal implementation**

Remove workbook-facing labels, links, and props from the changed portal surfaces while leaving compatibility fields untouched where unrelated flows still need them.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/app/portal/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/portal/create-dashboard-dialog.tsx apps/web/src/components/portal/dashboard-list.tsx apps/web/src/app/portal/page.test.tsx apps/web/src/components/portal/dashboard-list.test.tsx
git commit -m "refactor: remove workbook portal affordances"
```

### Task 6: Run feature verification

**Files:**
- No code changes required unless failures are found

- [ ] **Step 1: Run targeted backend and web suites**

Run:
- `pnpm vitest packages/auth/src/authorization-api.test.ts`
- `pnpm vitest apps/backend/src/modules/auth/app.test.ts`
- `pnpm vitest apps/web/src/app/portal/page.test.tsx`
- `pnpm vitest 'apps/web/src/app/portal/[appName]/page.test.tsx'`
- `pnpm vitest 'apps/web/src/app/portal/[appName]/[dashboardId]/page.test.tsx'`

Expected: PASS

- [ ] **Step 2: Run a broader portal regression slice**

Run:
- `pnpm vitest apps/web/src/components/portal`

Expected: PASS or a narrow set of related failures to fix immediately.

- [ ] **Step 3: Run lint/test command used by the workspace if available**

Run: `pnpm test` or the closest targeted workspace command supported by this repo
Expected: PASS for the touched scope, or document any unrelated failures.

- [ ] **Step 4: Summarize verification**

Record the exact commands run and note any residual risk, especially around untouched workbook persistence and old route compatibility.
