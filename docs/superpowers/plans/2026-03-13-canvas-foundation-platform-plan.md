# Canvas Foundation Platform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the greenfield monorepo, shared TypeScript tooling, local service adapters, and Kubernetes-ready application skeleton for all other `canvas` subsystems.

**Architecture:** Use a pnpm/turborepo monorepo with separate `apps`, `packages`, and `infra` directories. Start with a single `apps/backend` modular-monolith service, a `apps/web` frontend, a shared config layer, and local adapters for Postgres, Redis, and S3-compatible storage so feature teams can build against stable interfaces.

**Tech Stack:** pnpm, Turborepo, TypeScript, Vitest, Fastify, Next.js, shadcn/ui, Prisma, PostgreSQL, Redis, S3-compatible storage, Kubernetes manifests

---

## Chunk 1: Workspace Bootstrap

### Task 1: Initialize repository and workspace tools

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `README.md`
- Create: `tools/tests/workspace-smoke.test.ts`

- [ ] **Step 1: Write the failing workspace smoke test**

```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("workspace bootstrap", () => {
  it("declares the root monorepo files", () => {
    expect(existsSync("pnpm-workspace.yaml")).toBe(true);
    expect(existsSync("turbo.json")).toBe(true);
    expect(existsSync("tsconfig.base.json")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tools/tests/workspace-smoke.test.ts`
Expected: FAIL because the workspace files and test runner are not configured yet.

- [ ] **Step 3: Create the root workspace files and scripts**

```json
{
  "name": "canvas",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tools/tests/workspace-smoke.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git init
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .gitignore .editorconfig README.md tools/tests/workspace-smoke.test.ts
git commit -m "chore: bootstrap canvas monorepo"
```

### Task 2: Create app and package skeletons

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/api/index.ts`
- Create: `apps/backend/src/worker/index.ts`
- Create: `apps/backend/src/modules/session/index.ts`
- Create: `apps/backend/src/modules/realtime/index.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/src/app/page.tsx`
- Create: `packages/config/src/index.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/queue/src/index.ts`
- Create: `packages/storage/src/index.ts`
- Test: `tools/tests/service-entrypoints.test.ts`

- [ ] **Step 1: Write the failing service entrypoint test**

```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("service skeletons", () => {
  it("creates all planned entrypoints", () => {
    expect(existsSync("apps/backend/src/main.ts")).toBe(true);
    expect(existsSync("apps/backend/src/api/index.ts")).toBe(true);
    expect(existsSync("apps/backend/src/worker/index.ts")).toBe(true);
    expect(existsSync("apps/backend/src/modules/session/index.ts")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tools/tests/service-entrypoints.test.ts`
Expected: FAIL because the directories do not exist yet.

- [ ] **Step 3: Create minimal service and package exports**

```ts
export function createStubService(name: string) {
  return { name, status: "bootstrapped" as const };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tools/tests/service-entrypoints.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps packages tools/tests/service-entrypoints.test.ts
git commit -m "chore: add service and package skeletons"
```

## Chunk 2: Shared Local Infrastructure

### Task 3: Add shared configuration and environment loading

**Files:**
- Create: `packages/config/src/env.ts`
- Create: `packages/config/src/services.ts`
- Create: `packages/config/src/index.ts`
- Create: `packages/config/vitest.config.ts`
- Test: `packages/config/src/env.test.ts`

- [ ] **Step 1: Write the failing config test**

```ts
import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";

describe("loadEnv", () => {
  it("returns the required local service URLs", () => {
    const env = loadEnv({
      DATABASE_URL: "postgres://canvas:canvas@localhost:5432/canvas",
      REDIS_URL: "redis://localhost:6379",
      S3_ENDPOINT: "http://localhost:9000"
    });

    expect(env.DATABASE_URL).toContain("postgres://");
    expect(env.REDIS_URL).toContain("redis://");
    expect(env.S3_ENDPOINT).toContain("http://");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/config/src/env.test.ts`
Expected: FAIL because `loadEnv` is missing.

- [ ] **Step 3: Implement the config parser**

```ts
export function loadEnv(source: Record<string, string | undefined>) {
  const required = ["DATABASE_URL", "REDIS_URL", "S3_ENDPOINT"] as const;

  for (const key of required) {
    if (!source[key]) throw new Error(`Missing env: ${key}`);
  }

  return {
    DATABASE_URL: source.DATABASE_URL!,
    REDIS_URL: source.REDIS_URL!,
    S3_ENDPOINT: source.S3_ENDPOINT!
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/config/src/env.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/config
git commit -m "chore: add shared environment config"
```

### Task 4: Add local adapters for Postgres, Redis, and S3

**Files:**
- Create: `packages/db/src/client.ts`
- Create: `packages/queue/src/client.ts`
- Create: `packages/storage/src/client.ts`
- Create: `packages/storage/src/types.ts`
- Test: `packages/storage/src/client.test.ts`

- [ ] **Step 1: Write the failing storage adapter test**

```ts
import { describe, expect, it } from "vitest";
import { createStorageClient } from "./client";

describe("createStorageClient", () => {
  it("returns an adapter with upload and download methods", () => {
    const storage = createStorageClient({
      endpoint: "http://localhost:9000",
      bucket: "canvas-raw"
    });

    expect(typeof storage.putObject).toBe("function");
    expect(typeof storage.getObject).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/storage/src/client.test.ts`
Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement minimal client wrappers**

```ts
export function createStorageClient(config: { endpoint: string; bucket: string }) {
  return {
    bucket: config.bucket,
    async putObject(key: string, body: Buffer | string) {
      return { key, size: Buffer.byteLength(body) };
    },
    async getObject(key: string) {
      return { key };
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/storage/src/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db packages/queue packages/storage
git commit -m "chore: add base infrastructure adapters"
```

## Chunk 3: Base Delivery Assets

### Task 5: Add Docker and Kubernetes skeletons

**Files:**
- Create: `Dockerfile.backend`
- Create: `Dockerfile.web`
- Create: `infra/k8s/base/namespace.yaml`
- Create: `infra/k8s/base/backend-api-deployment.yaml`
- Create: `infra/k8s/base/backend-worker-deployment.yaml`
- Create: `infra/k8s/base/web-deployment.yaml`
- Create: `infra/k8s/base/kustomization.yaml`
- Test: `tools/tests/k8s-layout.test.ts`

- [ ] **Step 1: Write the failing manifest layout test**

```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("k8s base layout", () => {
  it("contains a kustomization and core deployment manifests", () => {
    expect(existsSync("infra/k8s/base/kustomization.yaml")).toBe(true);
    expect(existsSync("infra/k8s/base/backend-api-deployment.yaml")).toBe(true);
    expect(existsSync("infra/k8s/base/backend-worker-deployment.yaml")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tools/tests/k8s-layout.test.ts`
Expected: FAIL because the manifests do not exist yet.

- [ ] **Step 3: Add minimal container and manifest definitions**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: canvas-backend-api
spec:
  replicas: 1
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tools/tests/k8s-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile.backend Dockerfile.web infra/k8s tools/tests/k8s-layout.test.ts
git commit -m "chore: add base container and kubernetes assets"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-canvas-foundation-platform-plan.md`. Ready to execute?
