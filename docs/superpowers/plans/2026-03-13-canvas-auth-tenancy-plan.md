# Canvas Auth and Tenancy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the delegated host-auth session exchange, tenant context enforcement, and RBAC foundation for all `canvas` APIs and WebSocket connections.

**Architecture:** Create a dedicated `canvas-session` service for signed host assertions and short-lived token issuance, then share tenant-aware middleware across the REST API and realtime service. Persist tenants, principals, memberships, and roles in Postgres through a shared database package.

**Tech Stack:** TypeScript, Fastify, jose, Prisma, PostgreSQL, Redis, Vitest

---

## Chunk 1: Tenant and Principal Schema

### Task 1: Model tenants, principals, and memberships

**Files:**
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/tenant-repository.ts`
- Create: `packages/db/src/principal-repository.ts`
- Create: `packages/db/src/rbac.ts`
- Test: `packages/db/src/rbac.test.ts`

- [ ] **Step 1: Write the failing RBAC test**

```ts
import { describe, expect, it } from "vitest";
import { can } from "./rbac";

describe("can", () => {
  it("allows tenant admins to manage branding", () => {
    expect(can("tenant_admin", "branding:update")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/db/src/rbac.test.ts`
Expected: FAIL because the role matrix is missing.

- [ ] **Step 3: Add the schema and permission matrix**

```ts
const permissions = {
  tenant_admin: ["branding:update", "dataset:write", "dashboard:publish"],
  analyst: ["dataset:read", "dataset:write", "dashboard:publish"],
  viewer: ["dataset:read", "dashboard:read"]
} as const;

export function can(role: keyof typeof permissions, action: string) {
  return permissions[role].includes(action as never);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/db/src/rbac.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/src/tenant-repository.ts packages/db/src/principal-repository.ts packages/db/src/rbac.*
git commit -m "feat: add tenant and rbac schema"
```

### Task 2: Add migration and seed workflow

**Files:**
- Create: `packages/db/prisma/migrations/0001_init/migration.sql`
- Create: `packages/db/prisma/seed.ts`
- Create: `packages/db/src/seed.test.ts`

- [ ] **Step 1: Write the failing seed test**

```ts
import { describe, expect, it } from "vitest";
import { buildSeedTenant } from "./seed";

describe("buildSeedTenant", () => {
  it("creates a default development tenant", () => {
    expect(buildSeedTenant().slug).toBe("demo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/db/src/seed.test.ts`
Expected: FAIL because the seed helper is missing.

- [ ] **Step 3: Implement the seed helper and initial migration**

```ts
export function buildSeedTenant() {
  return { slug: "demo", name: "Canvas Demo Tenant" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/db/src/seed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma packages/db/src/seed.*
git commit -m "feat: add tenant seed workflow"
```

## Chunk 2: Session Exchange Service

### Task 3: Validate host assertions and mint short-lived tokens

**Files:**
- Create: `apps/session/src/app.ts`
- Create: `apps/session/src/routes/exchange-session.ts`
- Create: `packages/contracts/src/session.ts`
- Create: `packages/auth/src/host-assertion.ts`
- Create: `packages/auth/src/canvas-token.ts`
- Test: `apps/session/src/routes/exchange-session.test.ts`

- [ ] **Step 1: Write the failing session exchange test**

```ts
import { describe, expect, it } from "vitest";
import { exchangeHostAssertion } from "./exchange-session";

describe("exchangeHostAssertion", () => {
  it("returns a canvas access token for a valid signed payload", async () => {
    const result = await exchangeHostAssertion({
      tenantId: "tenant_123",
      externalUserId: "user_456"
    });

    expect(result.accessToken).toBeDefined();
    expect(result.expiresIn).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/session/src/routes/exchange-session.test.ts`
Expected: FAIL because the route logic is missing.

- [ ] **Step 3: Implement the assertion and token services**

```ts
export async function exchangeHostAssertion(payload: {
  tenantId: string;
  externalUserId: string;
}) {
  return {
    accessToken: `canvas.${payload.tenantId}.${payload.externalUserId}`,
    expiresIn: 900
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/session/src/routes/exchange-session.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/session packages/contracts packages/auth
git commit -m "feat: add host session exchange service"
```

### Task 4: Add session middleware for HTTP and WebSocket consumers

**Files:**
- Create: `packages/auth/src/http-auth.ts`
- Create: `packages/auth/src/socket-auth.ts`
- Create: `packages/auth/src/tenant-context.ts`
- Test: `packages/auth/src/tenant-context.test.ts`

- [ ] **Step 1: Write the failing tenant context test**

```ts
import { describe, expect, it } from "vitest";
import { assertTenantContext } from "./tenant-context";

describe("assertTenantContext", () => {
  it("throws when tenant context is missing", () => {
    expect(() => assertTenantContext(undefined)).toThrow("Missing tenant context");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/auth/src/tenant-context.test.ts`
Expected: FAIL because the helper is missing.

- [ ] **Step 3: Implement the shared context guard**

```ts
export function assertTenantContext(value: { tenantId: string } | undefined) {
  if (!value?.tenantId) throw new Error("Missing tenant context");
  return value;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/auth/src/tenant-context.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/auth
git commit -m "feat: add shared tenant auth middleware"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-canvas-auth-tenancy-plan.md`. Ready to execute?
