# Canvas Auth and App Context Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tenant-named auth runtime with app-scoped auth and session flows based on `amtoken` + external authorization endpoints.

**Architecture:** Introduce explicit `appContext` claims and middleware in backend/auth packages. Keep current external authorization integration as source of truth, and add app-switch/session APIs that support users with access to multiple apps.

**Tech Stack:** TypeScript, Fastify, Prisma 7, PostgreSQL, Vitest

---

## Chunk 1: App Context Contracts and Token Claims

### Task 1: Add app-context contracts and token decode helpers

**Files:**
- Create: `packages/contracts/src/app-context.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/auth/src/canvas-token.ts`
- Modify: `packages/auth/src/canvas-token-decode.ts`
- Test: `packages/auth/src/canvas-token-decode.test.ts`

- [ ] **Step 1: Write the failing token decode test**
- [ ] **Step 2: Run test to verify it fails**
Run: `corepack pnpm vitest run packages/auth/src/canvas-token-decode.test.ts`
Expected: FAIL due to missing app-context claim mapping.
- [ ] **Step 3: Implement app-context claim shape**
- [ ] **Step 4: Run test to verify it passes**
Run: `corepack pnpm vitest run packages/auth/src/canvas-token-decode.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/contracts/src/app-context.ts packages/contracts/src/index.ts packages/auth/src/canvas-token.ts packages/auth/src/canvas-token-decode.ts packages/auth/src/canvas-token-decode.test.ts
git commit -m "feat: add app-scoped session token claims"
```

### Task 2: Replace tenant request context usage in shared guards

**Files:**
- Modify: `packages/auth/src/tenant-context.ts`
- Create: `packages/auth/src/app-context.ts`
- Modify: `apps/backend/src/modules/auth/app.ts`
- Test: `packages/auth/src/tenant-context.test.ts`
- Test: `apps/backend/src/modules/auth/app.test.ts`

- [ ] **Step 1: Write failing app-context guard tests**
- [ ] **Step 2: Run tests to verify failures**
Run: `corepack pnpm vitest run packages/auth/src/tenant-context.test.ts apps/backend/src/modules/auth/app.test.ts`
Expected: FAIL due to old tenant-only shape.
- [ ] **Step 3: Implement app-context guard and route usage**
- [ ] **Step 4: Run tests to verify they pass**
Run: `corepack pnpm vitest run packages/auth/src/tenant-context.test.ts apps/backend/src/modules/auth/app.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/auth/src/tenant-context.ts packages/auth/src/app-context.ts apps/backend/src/modules/auth/app.ts packages/auth/src/tenant-context.test.ts apps/backend/src/modules/auth/app.test.ts
git commit -m "refactor: replace tenant context with app context guards"
```

## Chunk 2: SSO Session and App Selection APIs

### Task 3: Extend session exchange for amtoken and app-list response

**Files:**
- Modify: `apps/backend/src/modules/session/routes/exchange-session.ts`
- Modify: `apps/backend/src/modules/session/routes/exchange-session.test.ts`
- Modify: `packages/auth/src/authorization-api.ts`
- Modify: `packages/auth/src/host-assertion.ts`

- [ ] **Step 1: Add failing tests for amtoken exchange and app list**
- [ ] **Step 2: Run tests to verify failures**
Run: `corepack pnpm vitest run apps/backend/src/modules/session/routes/exchange-session.test.ts`
Expected: FAIL due to old payload/response shape.
- [ ] **Step 3: Implement amtoken-driven exchange mapping**
- [ ] **Step 4: Run tests to verify passes**
Run: `corepack pnpm vitest run apps/backend/src/modules/session/routes/exchange-session.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/backend/src/modules/session/routes/exchange-session.ts apps/backend/src/modules/session/routes/exchange-session.test.ts packages/auth/src/authorization-api.ts packages/auth/src/host-assertion.ts
git commit -m "feat: add amtoken session exchange with app access mapping"
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
- [ ] **Step 3: Implement route and context-switch logic**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run apps/backend/src/modules/auth/select-app.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add apps/backend/src/modules/auth/routes/select-app.ts apps/backend/src/modules/auth/app.ts apps/backend/src/modules/auth/select-app.test.ts
git commit -m "feat: add active app selection endpoint"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-22-canvas-auth-app-context-plan.md`. Ready to execute?
