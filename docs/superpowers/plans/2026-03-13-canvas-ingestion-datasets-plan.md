# Canvas Ingestion and Datasets Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Accept file uploads and host-pushed data, normalize them into tenant-scoped Postgres tables, and expose dataset metadata plus import lifecycle APIs.

**Architecture:** Keep raw payloads in S3, queue import jobs in Redis, and perform parsing plus normalization in dedicated worker processes. Store dataset metadata, schema versions, warnings, and normalized rows in Postgres behind the `canvas-backend` dataset endpoints, with imports executed by backend worker mode.

**Tech Stack:** TypeScript, Fastify, PostgreSQL, Prisma, Redis, S3-compatible storage, csv-parse, zod, Vitest

---

## Chunk 1: Dataset Metadata and Import Contracts

### Task 1: Add dataset and import job schema

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/contracts/src/datasets.ts`
- Create: `packages/db/src/dataset-repository.ts`
- Create: `packages/db/src/import-job-repository.ts`
- Test: `packages/db/src/dataset-repository.test.ts`

- [ ] **Step 1: Write the failing dataset repository test**

```ts
import { describe, expect, it } from "vitest";
import { buildDatasetRecord } from "./dataset-repository";

describe("buildDatasetRecord", () => {
  it("creates tenant-scoped dataset metadata", () => {
    const dataset = buildDatasetRecord({
      tenantId: "tenant_123",
      name: "Sales Upload"
    });

    expect(dataset.tenantId).toBe("tenant_123");
    expect(dataset.name).toBe("Sales Upload");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/db/src/dataset-repository.test.ts`
Expected: FAIL because the repository helper is missing.

- [ ] **Step 3: Implement dataset metadata builders**

```ts
export function buildDatasetRecord(input: { tenantId: string; name: string }) {
  return {
    tenantId: input.tenantId,
    name: input.name,
    status: "queued" as const
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/db/src/dataset-repository.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/contracts/src/datasets.ts packages/db/src/dataset-repository.ts packages/db/src/import-job-repository.ts packages/db/src/dataset-repository.test.ts
git commit -m "feat: add dataset and import job metadata"
```

### Task 2: Add upload initiation and finalize endpoints

**Files:**
- Create: `apps/backend/src/modules/datasets/routes/create-upload.ts`
- Create: `apps/backend/src/modules/datasets/routes/finalize-upload.ts`
- Create: `packages/storage/src/presign.ts`
- Test: `apps/backend/src/modules/datasets/routes/create-upload.test.ts`

- [ ] **Step 1: Write the failing upload route test**

```ts
import { describe, expect, it } from "vitest";
import { createUploadSession } from "./create-upload";

describe("createUploadSession", () => {
  it("returns an upload key and target bucket", async () => {
    const result = await createUploadSession({
      tenantId: "tenant_123",
      filename: "sales.csv"
    });

    expect(result.objectKey).toContain("tenant_123");
    expect(result.bucket).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/modules/datasets/routes/create-upload.test.ts`
Expected: FAIL because the route helper is missing.

- [ ] **Step 3: Implement minimal upload initiation and finalize handlers**

```ts
export async function createUploadSession(input: {
  tenantId: string;
  filename: string;
}) {
  return {
    bucket: "canvas-raw",
    objectKey: `${input.tenantId}/uploads/${input.filename}`
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/modules/datasets/routes/create-upload.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/datasets packages/storage/src/presign.ts
git commit -m "feat: add dataset upload endpoints"
```

## Chunk 2: Worker Pipeline and Normalization

### Task 3: Build the import queue contract and worker runner

**Files:**
- Create: `packages/queue/src/import-jobs.ts`
- Create: `apps/backend/src/worker/handlers/run-import-job.ts`
- Create: `apps/backend/src/worker/index.ts`
- Test: `apps/backend/src/worker/handlers/run-import-job.test.ts`

- [ ] **Step 1: Write the failing import worker test**

```ts
import { describe, expect, it } from "vitest";
import { buildImportJobPayload } from "@canvas/queue/import-jobs";

describe("buildImportJobPayload", () => {
  it("includes the dataset and object location", () => {
    const payload = buildImportJobPayload({
      tenantId: "tenant_123",
      datasetId: "ds_1",
      objectKey: "tenant_123/uploads/sales.csv"
    });

    expect(payload.datasetId).toBe("ds_1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/worker/handlers/run-import-job.test.ts`
Expected: FAIL because the queue contract is missing.

- [ ] **Step 3: Implement the import queue contract and worker entrypoint**

```ts
export function buildImportJobPayload(input: {
  tenantId: string;
  datasetId: string;
  objectKey: string;
}) {
  return input;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/worker/handlers/run-import-job.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/queue/src/import-jobs.ts apps/backend/src/worker
git commit -m "feat: add import worker pipeline"
```

### Task 4: Parse CSV uploads and normalize rows

**Files:**
- Create: `apps/backend/src/modules/ingestion/parsers/csv.ts`
- Create: `apps/backend/src/modules/ingestion/normalize/infer-schema.ts`
- Create: `apps/backend/src/modules/ingestion/normalize/normalize-rows.ts`
- Create: `apps/backend/src/modules/ingestion/persist/write-normalized-table.ts`
- Test: `apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts`

- [ ] **Step 1: Write the failing normalization test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeRows } from "./normalize-rows";

describe("normalizeRows", () => {
  it("converts blank strings to null and trims headers", () => {
    const result = normalizeRows({
      headers: [" Order Date ", "Amount"],
      rows: [["2026-03-01", "42"], ["", "18"]]
    });

    expect(result.headers[0]).toBe("order_date");
    expect(result.rows[1][0]).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts`
Expected: FAIL because the normalization code is missing.

- [ ] **Step 3: Implement parsing and normalization helpers**

```ts
export function normalizeRows(input: {
  headers: string[];
  rows: string[][];
}) {
  return {
    headers: input.headers.map((value) =>
      value.trim().toLowerCase().replaceAll(" ", "_")
    ),
    rows: input.rows.map((row) => row.map((value) => (value === "" ? null : value)))
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/modules/ingestion/normalize/normalize-rows.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/ingestion
git commit -m "feat: add csv parsing and normalization"
```

## Chunk 3: Dataset APIs and Status Updates

### Task 5: Expose dataset listing, status, and warnings

**Files:**
- Create: `apps/backend/src/modules/datasets/routes/list-datasets.ts`
- Create: `apps/backend/src/modules/datasets/routes/get-dataset.ts`
- Create: `apps/backend/src/modules/datasets/routes/list-import-jobs.ts`
- Test: `apps/backend/src/modules/datasets/routes/list-datasets.test.ts`

- [ ] **Step 1: Write the failing dataset listing test**

```ts
import { describe, expect, it } from "vitest";
import { mapDatasetSummary } from "./list-datasets";

describe("mapDatasetSummary", () => {
  it("returns the dataset status and warning count", () => {
    const summary = mapDatasetSummary({
      id: "ds_1",
      name: "Sales Upload",
      status: "warning",
      warnings: [{ code: "mixed_type" }]
    });

    expect(summary.warningCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/modules/datasets/routes/list-datasets.test.ts`
Expected: FAIL because the mapper is missing.

- [ ] **Step 3: Implement dataset summary routes**

```ts
export function mapDatasetSummary(input: {
  id: string;
  name: string;
  status: string;
  warnings: Array<{ code: string }>;
}) {
  return {
    id: input.id,
    name: input.name,
    status: input.status,
    warningCount: input.warnings.length
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/modules/datasets/routes/list-datasets.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/datasets
git commit -m "feat: expose dataset and import job status"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-canvas-ingestion-datasets-plan.md`. Ready to execute?
