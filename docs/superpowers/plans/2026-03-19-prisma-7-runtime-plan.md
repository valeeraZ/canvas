# Prisma 7 Runtime Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `packages/db` to Prisma 7 and wire `apps/backend` into a real Fastify API app without expanding into unrelated backend work.

**Architecture:** Keep Prisma 7 concerns isolated inside `packages/db` by moving runtime configuration into `prisma.config.ts`, generating the client into a package-local path, and exposing a single `createDbClient()` factory. Keep Fastify integration minimal by introducing an API app factory that mounts a health route and the existing session exchange module.

**Tech Stack:** TypeScript, Prisma 7, PostgreSQL, Fastify, Vitest

---

## Chunk 1: Prisma 7 Package Migration

### Task 1: Add Prisma 7 config and generated client path

**Files:**
- Modify: `packages/db/package.json`
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma.config.ts`
- Test: `packages/db/src/client.test.ts`

- [ ] **Step 1: Write the failing Prisma client test**

```ts
import { describe, expect, it } from "vitest";
import { createDbClient } from "./client";

describe("createDbClient", () => {
  it("returns a client that can disconnect", async () => {
    const client = createDbClient({
      connectionString: "postgres://canvas:canvas@localhost:5432/canvas"
    });

    expect(typeof client.$disconnect).toBe("function");
    await expect(client.$disconnect()).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run packages/db/src/client.test.ts`
Expected: FAIL because the current DB client is still a stub or Prisma generation is not configured.

- [ ] **Step 3: Implement Prisma 7 configuration**

```ts
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
```

Update the generator to Prisma 7 style with a package-local output path and add package scripts for `generate`, `migrate`, `db:push`, and `seed`.

- [ ] **Step 4: Generate Prisma client**

Run: `corepack pnpm --filter @canvas/db exec prisma generate`
Expected: PASS and generate the client into `packages/db/src/generated/prisma`.

- [ ] **Step 5: Run test to verify it passes**

Run: `corepack pnpm vitest run packages/db/src/client.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/db/package.json packages/db/prisma/schema.prisma packages/db/prisma.config.ts packages/db/src/client.ts packages/db/src/client.test.ts pnpm-lock.yaml
git commit -m "feat: upgrade db package to prisma 7"
```

## Chunk 2: Fastify Runtime Wiring

### Task 2: Create the API app factory and mount session routes

**Files:**
- Create: `apps/backend/src/api/app.ts`
- Create: `apps/backend/src/api/app.test.ts`
- Modify: `apps/backend/src/api/index.ts`
- Modify: `apps/backend/src/main.ts`
- Modify: `apps/backend/src/modules/session/app.ts`

- [ ] **Step 1: Write the failing Fastify app test**

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "./app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("createApiApp", () => {
  it("registers health and session exchange routes", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    });

    apps.push(app);

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: { token: "local-dev-token", appName: "canvas" }
    });

    expect(session.statusCode).toBe(200);
    expect(session.json().accessToken).toContain("canvas.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run apps/backend/src/api/app.test.ts`
Expected: FAIL because the Fastify app factory is missing.

- [ ] **Step 3: Implement the app factory and route registration**

```ts
import Fastify from "fastify";

export function createApiApp() {
  const app = Fastify();

  app.get("/health", async () => ({ status: "ok" as const }));
  void app.register(sessionModule, options);

  return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run apps/backend/src/api/app.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/package.json apps/backend/src/api apps/backend/src/main.ts apps/backend/src/modules/session/app.ts pnpm-lock.yaml
git commit -m "feat: add fastify api app runtime"
```

## Chunk 3: Verification

### Task 3: Verify runtime integration does not break current features

**Files:**
- Verify only

- [ ] **Step 1: Run focused runtime verification**

Run: `corepack pnpm vitest run packages/db/src/client.test.ts apps/backend/src/api/app.test.ts`
Expected: PASS.

- [ ] **Step 2: Run broader regression verification**

Run: `corepack pnpm vitest run`
Expected: PASS.

- [ ] **Step 3: Summarize readiness**

Confirm that:

- Prisma 7 client generation works
- Fastify app factory works
- session exchange remains reachable through the backend runtime
- all Vitest suites still pass

Plan complete and saved to `docs/superpowers/plans/2026-03-19-prisma-7-runtime-plan.md`. Ready to execute?
