# Canvas App Management Create Flows Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dashboard and workbook creation flows inside the Portal app management pages, plus a workbook detail page that links workbook structure back to dashboard management.

**Architecture:** Reuse existing backend `POST /dashboards`, `POST /workbooks`, and `GET /workbooks/:workbookId` endpoints through the Next web proxy layer. Add lightweight shadcn dialogs for create flows, keep dashboard creation redirecting into dashboard detail, and add a server-rendered workbook detail page using the existing backend client.

**Tech Stack:** Next.js App Router, TypeScript, shadcn/ui, Fastify, Vitest, native fetch

---

## Chunk 1: Proxy Create Flows

### Task 1: Add failing web route tests for dashboard and workbook creation

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/dashboards/route.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/workbooks/route.test.ts`

- [ ] Step 1: Write failing POST route tests for dashboard creation and workbook creation.
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/app/api/canvas/dashboards/route.test.ts apps/web/src/app/api/canvas/workbooks/route.test.ts` and verify the new tests fail.
- [ ] Step 3: Implement the minimal route behavior through the portal backend client.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/web/src/app/api/canvas/dashboards/route.test.ts apps/web/src/app/api/canvas/workbooks/route.test.ts` and verify pass.

### Task 2: Extend client helpers for create and workbook detail APIs

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/backend-client.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.ts`

- [ ] Step 1: Add the minimal helper methods:
  - `createDashboard({ name, workbookId? })`
  - `createWorkbook({ name })`
  - `getWorkbook(workbookId)`
- [ ] Step 2: Run the route tests again as the verification surface.

## Chunk 2: Portal Management UI

### Task 3: Add create affordances to dashboard and workbook inventory

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/create-dashboard-dialog.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/create-workbook-dialog.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/dashboards/page.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/workbooks/page.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-list.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/workbook-list.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-list.test.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/workbook-list.test.tsx`

- [ ] Step 1: Write failing component tests for visible create buttons and workbook management links.
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/components/portal/workbook-list.test.tsx` and verify failure.
- [ ] Step 3: Implement minimal create dialogs and button wiring.
- [ ] Step 4: Re-run the component tests and verify pass.

### Task 4: Add workbook detail page

**Files:**
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/workbooks/[workbookId]/page.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/workbooks/[workbookId]/page.test.tsx`

- [ ] Step 1: Write a failing page test that expects workbook detail content and related dashboard links.
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/app/portal/workbooks/[workbookId]/page.test.tsx` and verify failure.
- [ ] Step 3: Implement the workbook detail page with workbook metadata and matching dashboards.
- [ ] Step 4: Re-run the page test and verify pass.

## Chunk 3: Verification

### Task 5: Final verification

**Files:**
- No code changes expected

- [ ] Step 1: Run `corepack pnpm vitest run apps/web/src/app/api/canvas/dashboards/route.test.ts apps/web/src/app/api/canvas/workbooks/route.test.ts apps/web/src/components/portal/dashboard-list.test.tsx apps/web/src/components/portal/workbook-list.test.tsx apps/web/src/app/portal/workbooks/[workbookId]/page.test.tsx`
- [ ] Step 2: Run `corepack pnpm --dir apps/web build`
- [ ] Step 3: Commit once the verification passes
