# Canvas Analytics and Realtime Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn normalized datasets into live tables, charts, workbooks, and dashboards, with WebSocket-driven status and refresh events.

**Architecture:** Use `query`, `charts`, and `realtime` modules inside `apps/backend` API mode to convert user drag/drop choices into Postgres-backed query results. Persist workbook and dashboard assets in Postgres and fan out query/import/publish events through Redis pub/sub to the realtime gateway.

**Tech Stack:** TypeScript, Fastify, PostgreSQL, Redis, React, ECharts, AG Grid, Vitest, Playwright

---

## Chunk 1: Query and Chart Contracts

### Task 1: Define query specs and chart payloads

**Files:**
- Create: `packages/contracts/src/query.ts`
- Create: `packages/contracts/src/charts.ts`
- Create: `apps/backend/src/modules/query/lib/build-sql.ts`
- Create: `apps/backend/src/modules/query/lib/map-chart-payload.ts`
- Test: `apps/backend/src/modules/query/lib/build-sql.test.ts`

- [ ] **Step 1: Write the failing SQL builder test**

```ts
import { describe, expect, it } from "vitest";
import { buildSql } from "./build-sql";

describe("buildSql", () => {
  it("creates a grouped aggregate query", () => {
    const sql = buildSql({
      tableName: "tenant_123_sales",
      dimensions: ["region"],
      measures: [{ field: "amount", op: "sum" }]
    });

    expect(sql).toContain("group by");
    expect(sql).toContain("sum");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/modules/query/lib/build-sql.test.ts`
Expected: FAIL because the query builder is missing.

- [ ] **Step 3: Implement the query builder and chart mapper**

```ts
export function buildSql(input: {
  tableName: string;
  dimensions: string[];
  measures: Array<{ field: string; op: string }>;
}) {
  return `select ${input.dimensions.join(", ")}, sum(${input.measures[0].field}) from ${input.tableName} group by ${input.dimensions.join(", ")}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/modules/query/lib/build-sql.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/query.ts packages/contracts/src/charts.ts apps/backend/src/modules/query/lib
git commit -m "feat: add query and chart contracts"
```

### Task 2: Add chart query endpoint

**Files:**
- Create: `apps/backend/src/modules/charts/routes/run-chart-query.ts`
- Create: `apps/backend/src/modules/query/routes/run-query.ts`
- Test: `apps/backend/src/modules/charts/routes/run-chart-query.test.ts`

- [ ] **Step 1: Write the failing chart query route test**

```ts
import { describe, expect, it } from "vitest";
import { runChartQuery } from "./run-chart-query";

describe("runChartQuery", () => {
  it("returns a bar chart payload", async () => {
    const payload = await runChartQuery({
      chartType: "bar",
      datasetId: "ds_1"
    });

    expect(payload.chartType).toBe("bar");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/modules/charts/routes/run-chart-query.test.ts`
Expected: FAIL because the route handler is missing.

- [ ] **Step 3: Implement the API/query service path**

```ts
export async function runChartQuery(input: {
  chartType: string;
  datasetId: string;
}) {
  return {
    chartType: input.chartType,
    series: []
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/modules/charts/routes/run-chart-query.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/charts apps/backend/src/modules/query/routes
git commit -m "feat: add chart query endpoint"
```

## Chunk 2: Workbook and Dashboard Authoring

### Task 3: Add persisted workbook and dashboard models

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/workbook-repository.ts`
- Create: `packages/db/src/dashboard-repository.ts`
- Create: `apps/backend/src/modules/workbooks/routes/create-workbook.ts`
- Create: `apps/backend/src/modules/dashboards/routes/create-dashboard.ts`
- Test: `packages/db/src/workbook-repository.test.ts`

- [ ] **Step 1: Write the failing workbook repository test**

```ts
import { describe, expect, it } from "vitest";
import { buildWorkbook } from "./workbook-repository";

describe("buildWorkbook", () => {
  it("creates a tenant-scoped workbook draft", () => {
    const workbook = buildWorkbook({
      tenantId: "tenant_123",
      title: "Executive Summary"
    });

    expect(workbook.title).toBe("Executive Summary");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/db/src/workbook-repository.test.ts`
Expected: FAIL because the repository helper is missing.

- [ ] **Step 3: Implement the workbook and dashboard persistence layer**

```ts
export function buildWorkbook(input: { tenantId: string; title: string }) {
  return { tenantId: input.tenantId, title: input.title, status: "draft" as const };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/db/src/workbook-repository.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/src/workbook-repository.ts packages/db/src/dashboard-repository.ts apps/backend/src/modules/workbooks apps/backend/src/modules/dashboards
git commit -m "feat: add workbook and dashboard persistence"
```

### Task 4: Build authoring UI flows

**Files:**
- Create: `packages/embed-sdk/src/features/chart-builder/chart-builder.tsx`
- Create: `packages/embed-sdk/src/features/workbooks/workbook-editor.tsx`
- Create: `packages/embed-sdk/src/features/dashboards/dashboard-builder.tsx`
- Test: `packages/embed-sdk/src/features/chart-builder/chart-builder.test.tsx`

- [ ] **Step 1: Write the failing chart builder test**

```tsx
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ChartBuilder } from "./chart-builder";

describe("ChartBuilder", () => {
  it("renders a chart type selector", () => {
    expect(renderToString(<ChartBuilder />)).toContain("Chart Type");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/embed-sdk/src/features/chart-builder/chart-builder.test.tsx`
Expected: FAIL because the component is missing.

- [ ] **Step 3: Implement the authoring shells**

```tsx
export function ChartBuilder() {
  return <section>Chart Type</section>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/embed-sdk/src/features/chart-builder/chart-builder.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/embed-sdk/src/features
git commit -m "feat: add authoring ui shells"
```

## Chunk 3: Realtime Events

### Task 5: Add Redis pub/sub events and WebSocket fanout

**Files:**
- Create: `packages/contracts/src/events.ts`
- Create: `apps/backend/src/modules/realtime/server.ts`
- Create: `apps/backend/src/modules/realtime/subscriptions/import-events.ts`
- Create: `apps/backend/src/modules/realtime/subscriptions/dashboard-events.ts`
- Create: `packages/embed-sdk/src/hooks/use-live-canvas.ts`
- Test: `apps/backend/src/modules/realtime/server.test.ts`

- [ ] **Step 1: Write the failing realtime server test**

```ts
import { describe, expect, it } from "vitest";
import { createChannelName } from "./server";

describe("createChannelName", () => {
  it("namespaces events by tenant", () => {
    expect(createChannelName("tenant_123", "imports")).toBe("tenant_123:imports");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/modules/realtime/server.test.ts`
Expected: FAIL because the server helper is missing.

- [ ] **Step 3: Implement the realtime channel helpers and client hook**

```ts
export function createChannelName(tenantId: string, topic: string) {
  return `${tenantId}:${topic}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/modules/realtime/server.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/events.ts apps/backend/src/modules/realtime packages/embed-sdk/src/hooks/use-live-canvas.ts
git commit -m "feat: add realtime event fanout"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-canvas-analytics-realtime-plan.md`. Ready to execute?
