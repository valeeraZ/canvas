# Session Tenant Fastify Prisma Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist session exchange identities into Prisma and attach tenant context to Fastify requests.

**Architecture:** Add focused Prisma stores for tenants, principals, and memberships, then extend the existing session exchange path to upsert those records. Add a lightweight Fastify auth plugin that decodes the issued canvas token and exposes tenant context on the request for downstream handlers.

**Tech Stack:** TypeScript, Fastify, Prisma 7, PostgreSQL, Vitest

---

## Chunk 1: Prisma Stores

### Task 1: Add tenant, principal, and membership stores

**Files:**
- Create: `packages/db/src/tenant-store.ts`
- Create: `packages/db/src/principal-store.ts`
- Create: `packages/db/src/membership-store.ts`
- Create: `packages/db/src/tenant-store.test.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Write the failing store test**

```ts
import { describe, expect, it } from "vitest";
import { toTenantRecord } from "./tenant-store";

describe("toTenantRecord", () => {
  it("normalizes a persisted tenant", () => {
    const tenant = toTenantRecord({
      id: "tenant_1",
      slug: "canvas",
      name: "Canvas"
    });

    expect(tenant.slug).toBe("canvas");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run packages/db/src/tenant-store.test.ts`
Expected: FAIL because the Prisma store file is missing.

- [ ] **Step 3: Implement the stores**

Implement upsert-oriented stores for tenants, principals, and memberships.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run packages/db/src/tenant-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/tenant-store.ts packages/db/src/principal-store.ts packages/db/src/membership-store.ts packages/db/src/tenant-store.test.ts packages/db/src/index.ts
git commit -m "feat: add prisma tenant identity stores"
```

## Chunk 2: Session Persistence and Fastify Context

### Task 2: Persist identity on session exchange and add tenant context plugin

**Files:**
- Modify: `apps/backend/src/modules/session/routes/exchange-session.ts`
- Create: `apps/backend/src/modules/auth/app.ts`
- Create: `apps/backend/src/modules/auth/app.test.ts`
- Create: `packages/auth/src/canvas-token-decode.ts`
- Modify: `apps/backend/src/api/app.ts`

- [ ] **Step 1: Write the failing Fastify auth test**

Add a test that:

- exchanges a session
- calls a protected route with the returned access token
- expects tenant context in the response

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run apps/backend/src/modules/auth/app.test.ts`
Expected: FAIL because the auth plugin and protected route are missing.

- [ ] **Step 3: Implement persistence and tenant context wiring**

Add token decoding, Fastify request decoration, and a protected route such as `GET /auth/me`.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run apps/backend/src/modules/auth/app.test.ts apps/backend/src/api/app.test.ts apps/backend/src/modules/session/routes/exchange-session.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/auth apps/backend/src/modules/session/routes/exchange-session.ts packages/auth/src/canvas-token-decode.ts apps/backend/src/api/app.ts
git commit -m "feat: persist session identities and tenant context"
```

## Chunk 3: Database-backed Integration Verification

### Task 3: Add a gated session integration test

**Files:**
- Create: `apps/backend/src/modules/session/app.integration.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create a gated test that:

- exchanges a session with mock external auth context
- verifies tenant, principal, and membership rows were written
- verifies `/auth/me` returns tenant context using the returned token

- [ ] **Step 2: Run test to verify it fails**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run apps/backend/src/modules/session/app.integration.test.ts`
Expected: FAIL until the persistence wiring is complete.

- [ ] **Step 3: Implement minimal fixture setup**

Seed and clean test rows in local PostgreSQL around the exchange and auth flow.

- [ ] **Step 4: Run test to verify it passes**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run apps/backend/src/modules/session/app.integration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/session/app.integration.test.ts
git commit -m "test: add session identity db integration coverage"
```

## Chunk 4: Verification

### Task 4: Run regression

**Files:**
- Verify only

- [ ] **Step 1: Run focused tests**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run packages/db/src/tenant-store.test.ts apps/backend/src/modules/auth/app.test.ts apps/backend/src/modules/session/app.integration.test.ts`
Expected: PASS.

- [ ] **Step 2: Run full regression**

Run: `DATABASE_URL=postgres://canvas:canvas@localhost:5432/canvas corepack pnpm vitest run`
Expected: PASS.

- [ ] **Step 3: Summarize readiness**

Confirm that session exchange now persists identities and that tenant context is available on Fastify requests.

Plan complete and saved to `docs/superpowers/plans/2026-03-19-session-tenant-fastify-prisma-plan.md`. Ready to execute?
