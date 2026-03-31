# Canvas Portal App Inventory Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Portal overview with an app inventory that lists every accessible app, sorts by recent usage, and routes users into app-scoped dashboard/workbook management.

**Architecture:** Add a new backend `GET /auth/apps` endpoint backed by the external authorization app-list API, store lightweight recent app/dashboard/workbook state in the Portal session cookie, and render `/portal` from real backend data plus recent ordering rules.

**Tech Stack:** Fastify, Next.js App Router, TypeScript, Vitest, shadcn/ui, native fetch

---

## Chunk 1: Authorization App List

### Task 1: Extend auth package for accessible apps

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/auth/src/authorization-api.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/auth/src/authorization-api.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/auth/src/index.ts`

- [ ] Step 1: Write the failing test for the external app-list API helper.
- [ ] Step 2: Run `corepack pnpm vitest run packages/auth/src/authorization-api.test.ts` and verify the new test fails.
- [ ] Step 3: Implement the minimal helper to call `GET /v1/authorization/roles`.
- [ ] Step 4: Re-run `corepack pnpm vitest run packages/auth/src/authorization-api.test.ts` and verify it passes.

### Task 2: Add backend `GET /auth/apps`

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/auth/app.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/modules/auth/app.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/backend/src/api/schema.ts`

- [ ] Step 1: Write the failing backend route test for `GET /auth/apps`.
- [ ] Step 2: Run `corepack pnpm vitest run apps/backend/src/modules/auth/app.test.ts` and verify the new test fails.
- [ ] Step 3: Implement the route and response schema.
- [ ] Step 4: Re-run `corepack pnpm vitest run apps/backend/src/modules/auth/app.test.ts apps/backend/src/api/app.test.ts` and verify they pass.

## Chunk 2: Portal Session Recent State

### Task 3: Track recent apps and resources in portal session

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/session.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/session/route.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/auth/select-app/route.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/session/route.test.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/api/canvas/auth/select-app/route.test.ts`

- [ ] Step 1: Write failing tests for recent app persistence.
- [ ] Step 2: Run focused route tests and verify failure.
- [ ] Step 3: Implement session shape changes and cookie writes.
- [ ] Step 4: Re-run focused route tests and verify pass.

## Chunk 3: Portal App Inventory Overview

### Task 4: Add backend-client support for app inventory

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/backend-client.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/lib/portal/api-client.ts`

- [ ] Step 1: Add failing tests where needed for app inventory loading.
- [ ] Step 2: Implement `listAccessibleApps()` and overview loaders.
- [ ] Step 3: Re-run focused tests.

### Task 5: Replace `/portal` session summary with app inventory cards

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/page.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/portal-shell.tsx`
- Create: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/app-inventory.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/app/portal/page.test.tsx`

- [ ] Step 1: Write a failing test for app inventory rendering and recent ordering.
- [ ] Step 2: Run `corepack pnpm vitest run apps/web/src/app/portal/page.test.tsx` and verify failure.
- [ ] Step 3: Implement the app inventory UI and remove session summary / session context navigation.
- [ ] Step 4: Re-run focused Portal tests and verify pass.

## Chunk 4: Verification

### Task 6: Final verification

**Files:**
- No code changes expected

- [ ] Step 1: Run `corepack pnpm vitest run packages/auth/src/authorization-api.test.ts apps/backend/src/modules/auth/app.test.ts apps/backend/src/api/app.test.ts apps/web/src/app/api/canvas/session/route.test.ts apps/web/src/app/api/canvas/auth/select-app/route.test.ts apps/web/src/app/portal/page.test.tsx`
- [ ] Step 2: Run `corepack pnpm --dir apps/web build`
- [ ] Step 3: Commit with a focused message once all verification passes
