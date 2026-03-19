# Datasets Fastify Prisma Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect dataset HTTP endpoints to Fastify and Prisma-backed persistence without expanding into worker or realtime flows.

**Architecture:** Add a focused Fastify plugin for dataset routes and a focused Prisma store layer in `packages/db`. Keep existing route helpers as pure mapping utilities and let the store layer own record translation from Prisma to contracts.

**Tech Stack:** TypeScript, Fastify, Prisma 7, PostgreSQL, Vitest

---

## Chunk 1: Prisma Stores

### Task 1: Add dataset and import job stores

**Files:**
- Create: `packages/db/src/dataset-store.ts`
- Create: `packages/db/src/import-job-store.ts`
- Create: `packages/db/src/dataset-store.test.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Write the failing dataset store test**

```ts
import { describe, expect, it } from "vitest";
import { toDatasetRecord } from "./dataset-store";

describe("toDatasetRecord", () => {
  it("normalizes persisted warnings", () => {
    const record = toDatasetRecord({
      id: "ds_1",
      tenantId: "tenant_demo",
      name: "Sales Upload",
      status: "queued",
      warnings: [{ code: "trimmed_header" }]
    });

    expect(record.warnings[0]?.code).toBe("trimmed_header");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run packages/db/src/dataset-store.test.ts`
Expected: FAIL because the Prisma store layer is missing.

- [ ] **Step 3: Implement the stores**

```ts
export function toDatasetRecord(input: {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  warnings: unknown;
}) {
  return {
    id: input.id,
    tenantId: input.tenantId,
    name: input.name,
    status: input.status,
    warnings: Array.isArray(input.warnings) ? input.warnings : []
  };
}
```

Add `create`, `listByTenant`, and `findByTenantAndId` store helpers for datasets and import jobs.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run packages/db/src/dataset-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/dataset-store.ts packages/db/src/import-job-store.ts packages/db/src/dataset-store.test.ts packages/db/src/index.ts
git commit -m "feat: add prisma dataset stores"
```

## Chunk 2: Fastify Dataset Module

### Task 2: Register dataset routes in Fastify

**Files:**
- Create: `apps/backend/src/modules/datasets/app.ts`
- Create: `apps/backend/src/modules/datasets/app.test.ts`
- Modify: `apps/backend/src/api/app.ts`

- [ ] **Step 1: Write the failing dataset app test**

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("dataset routes", () => {
  it("lists persisted datasets", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      datasets: {
        listDatasets: async () => [
          {
            id: "ds_1",
            tenantId: "tenant_demo",
            name: "Sales Upload",
            status: "ready",
            warnings: []
          }
        ]
      }
    });

    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/datasets" });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0]?.id).toBe("ds_1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts`
Expected: FAIL because the dataset Fastify plugin is missing.

- [ ] **Step 3: Implement the plugin and mount it**

```ts
export const datasetsModule: FastifyPluginAsync<DatasetsModuleOptions> = async (
  app,
  options
) => {
  app.get("/datasets", async () => {
    const datasets = await options.datasets.listDatasets(options.tenantId);
    return datasets.map(mapDatasetSummary);
  });
};
```

Add `GET /datasets/:datasetId` and `POST /datasets/uploads`.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run apps/backend/src/modules/datasets/app.test.ts apps/backend/src/api/app.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/datasets/app.ts apps/backend/src/modules/datasets/app.test.ts apps/backend/src/api/app.ts
git commit -m "feat: add fastify dataset routes"
```

## Chunk 3: Verification

### Task 3: Verify runtime integration

**Files:**
- Verify only

- [ ] **Step 1: Run focused tests**

Run: `corepack pnpm vitest run packages/db/src/dataset-store.test.ts apps/backend/src/modules/datasets/app.test.ts apps/backend/src/api/app.test.ts`
Expected: PASS.

- [ ] **Step 2: Run full regression**

Run: `corepack pnpm vitest run`
Expected: PASS.

- [ ] **Step 3: Summarize readiness**

Confirm that dataset list, detail, and upload initiation now run through Fastify and Prisma-backed stores.

Plan complete and saved to `docs/superpowers/plans/2026-03-19-datasets-fastify-prisma-plan.md`. Ready to execute?
