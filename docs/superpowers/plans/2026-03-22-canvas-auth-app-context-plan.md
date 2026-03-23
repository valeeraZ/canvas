# Canvas Auth and App Context Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tenant-named auth runtime with app-scoped auth and session flows based on `amtoken` + external authorization endpoints + Canvas-managed server-side app session.

**Architecture:** Treat `amtoken` as the only credential sent to Canvas APIs. Resolve authorization against external auth APIs, cache `(amtoken, app)` authorization snapshots with TTL, and keep only the selected app in a small Canvas-managed server-side session.

**Tech Stack:** TypeScript, Fastify, Prisma 7, PostgreSQL, Vitest

---

## Chunk 1: Authorization Resolution and Session Storage

### Task 1: Add cached authorization resolution and expiring stores

**Files:**
- Create: `packages/auth/src/expiring-store.ts`
- Create: `packages/auth/src/memory-expiring-store.ts`
- Create: `packages/auth/src/redis-expiring-store.ts`
- Create: `packages/auth/src/cached-authorization-resolver.ts`
- Modify: `packages/auth/src/index.ts`
- Test: `packages/auth/src/authorization-api.test.ts`

- [ ] **Step 1: Write the failing authorization cache test**
- [ ] **Step 2: Run test to verify it fails**
Run: `corepack pnpm vitest run packages/auth/src/authorization-api.test.ts`
Expected: FAIL due to missing TTL-backed authorization resolver.
- [ ] **Step 3: Implement expiring stores and cached resolution**
- [ ] **Step 4: Run test to verify it passes**
Run: `corepack pnpm vitest run packages/auth/src/authorization-api.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/auth/src/expiring-store.ts packages/auth/src/memory-expiring-store.ts packages/auth/src/redis-expiring-store.ts packages/auth/src/cached-authorization-resolver.ts packages/auth/src/index.ts packages/auth/src/authorization-api.test.ts
git commit -m "feat: add cached amtoken authorization resolution"
```

### Task 2: Add Canvas-managed session store for selected app

**Files:**
- Create: `apps/backend/src/modules/session/session-store.ts`
- Modify: `apps/backend/src/api/app.ts`
- Modify: `apps/backend/src/server.ts`
- Test: `apps/backend/src/server.test.ts`
- Test: `apps/backend/src/modules/auth/app.test.ts`

- [ ] **Step 1: Write failing session store and app-context tests**
- [ ] **Step 2: Run tests to verify failures**
Run: `corepack pnpm vitest run apps/backend/src/server.test.ts apps/backend/src/modules/auth/app.test.ts`
Expected: FAIL due to missing session storage and app-scoped context resolution.
- [ ] **Step 3: Implement session store and runtime wiring**
- [ ] **Step 4: Run tests to verify they pass**
Run: `corepack pnpm vitest run apps/backend/src/server.test.ts apps/backend/src/modules/auth/app.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/backend/src/modules/session/session-store.ts apps/backend/src/api/app.ts apps/backend/src/server.ts apps/backend/src/server.test.ts apps/backend/src/modules/auth/app.test.ts
git commit -m "feat: add Canvas server session for selected app"
```

## Chunk 2: SSO Session and App Selection APIs

### Task 3: Replace Canvas access token flow with amtoken session exchange

**Files:**
- Modify: `apps/backend/src/modules/session/routes/exchange-session.ts`
- Modify: `apps/backend/src/modules/session/routes/exchange-session.test.ts`
- Modify: `packages/contracts/src/session.ts`
- Modify: `apps/backend/src/modules/session/app.ts`

- [ ] **Step 1: Add failing tests for amtoken exchange and session cookie response**
- [ ] **Step 2: Run tests to verify failures**
Run: `corepack pnpm vitest run apps/backend/src/modules/session/routes/exchange-session.test.ts`
Expected: FAIL due to old Canvas access token response shape.
- [ ] **Step 3: Implement amtoken-driven exchange mapping and cookie session response**
- [ ] **Step 4: Run tests to verify passes**
Run: `corepack pnpm vitest run apps/backend/src/modules/session/routes/exchange-session.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/backend/src/modules/session/routes/exchange-session.ts apps/backend/src/modules/session/routes/exchange-session.test.ts packages/contracts/src/session.ts apps/backend/src/modules/session/app.ts
git commit -m "refactor: replace canvas token exchange with server session"
```

### Task 4: Add active app selection endpoint

**Files:**
- Create: `apps/backend/src/modules/auth/routes/select-app.ts`
- Modify: `apps/backend/src/modules/auth/app.ts`
- Test: `apps/backend/src/modules/auth/select-app.test.ts`

- [ ] **Step 1: Write failing select-app test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run apps/backend/src/modules/auth/select-app.test.ts`
Expected: FAIL because route is missing.
- [ ] **Step 3: Implement route and context-switch logic using server session update**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/backend/src/modules/auth/select-app.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/backend/src/modules/auth/routes/select-app.ts apps/backend/src/modules/auth/app.ts apps/backend/src/modules/auth/select-app.test.ts
git commit -m "feat: add active app selection endpoint"
```

## Current Status Note

The current implementation has already moved to:

- `Authorization: Bearer <amtoken>` as the only API credential
- Canvas-managed cookie session for `selectedApp`
- TTL-backed authorization cache for `(amtoken, app)`
- app-scoped dashboard routes running on request app context

Remaining follow-up work should focus on bringing the rest of the resource routes and SDK wiring fully onto the same session model.

Plan complete and saved to `docs/superpowers/plans/2026-03-22-canvas-auth-app-context-plan.md`. Ready to execute?
