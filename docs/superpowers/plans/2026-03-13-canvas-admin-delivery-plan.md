# Canvas Admin and Delivery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tenant admin controls, internal operator tooling, and the production-readiness assets needed to deploy `canvas` on Kubernetes.

**Architecture:** Extend the existing web app with tenant-admin and internal operator modules backed by the main REST API. Finalize the deployment layer with environment overlays, secrets wiring, health checks, migrations, and smoke tests for Kubernetes delivery.

**Tech Stack:** Next.js, TypeScript, Fastify, Prisma, PostgreSQL, Redis, Kubernetes, Kustomize, Vitest, Playwright

---

## Chunk 1: Tenant Admin and Operator Screens

### Task 1: Add tenant branding and feature flag screens

**Files:**
- Create: `apps/web/src/app/admin/branding/page.tsx`
- Create: `apps/web/src/app/admin/features/page.tsx`
- Create: `apps/web/src/components/admin/branding-form.tsx`
- Create: `apps/web/src/components/admin/feature-gates-form.tsx`
- Test: `apps/web/src/app/admin/branding/page.test.tsx`

- [ ] **Step 1: Write the failing tenant admin page test**

```tsx
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import Page from "./page";

describe("branding admin page", () => {
  it("renders the branding heading", () => {
    expect(renderToString(<Page />)).toContain("Brand Settings");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/app/admin/branding/page.test.tsx`
Expected: FAIL because the page is missing.

- [ ] **Step 3: Implement the tenant admin pages**

```tsx
export default function Page() {
  return <main>Brand Settings</main>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/app/admin/branding/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin apps/web/src/components/admin
git commit -m "feat: add tenant admin screens"
```

### Task 2: Add internal operator job and tenant overview pages

**Files:**
- Create: `apps/web/src/app/operator/tenants/page.tsx`
- Create: `apps/web/src/app/operator/jobs/page.tsx`
- Create: `apps/backend/src/modules/operator/routes/list-tenants.ts`
- Create: `apps/backend/src/modules/operator/routes/list-jobs.ts`
- Test: `apps/backend/src/modules/operator/routes/list-jobs.test.ts`

- [ ] **Step 1: Write the failing operator jobs test**

```ts
import { describe, expect, it } from "vitest";
import { mapOperatorJob } from "./list-jobs";

describe("mapOperatorJob", () => {
  it("returns tenant and job status for support tooling", () => {
    const job = mapOperatorJob({
      id: "job_1",
      tenantId: "tenant_123",
      status: "failed"
    });

    expect(job.status).toBe("failed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/backend/src/modules/operator/routes/list-jobs.test.ts`
Expected: FAIL because the operator route is missing.

- [ ] **Step 3: Implement the operator summaries**

```ts
export function mapOperatorJob(input: {
  id: string;
  tenantId: string;
  status: string;
}) {
  return input;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/backend/src/modules/operator/routes/list-jobs.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/operator apps/backend/src/modules/operator
git commit -m "feat: add operator support tooling"
```

## Chunk 2: Kubernetes Delivery Hardening

### Task 3: Add environment overlays, probes, and secrets wiring

**Files:**
- Create: `infra/k8s/overlays/dev/kustomization.yaml`
- Create: `infra/k8s/overlays/staging/kustomization.yaml`
- Create: `infra/k8s/overlays/prod/kustomization.yaml`
- Modify: `infra/k8s/base/backend-api-deployment.yaml`
- Modify: `infra/k8s/base/backend-worker-deployment.yaml`
- Create: `infra/k8s/base/backend-api-service.yaml`
- Create: `infra/k8s/base/web-service.yaml`
- Test: `tools/tests/k8s-overlays.test.ts`

- [ ] **Step 1: Write the failing overlays test**

```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("k8s overlays", () => {
  it("defines dev, staging, and prod overlays", () => {
    expect(existsSync("infra/k8s/overlays/dev/kustomization.yaml")).toBe(true);
    expect(existsSync("infra/k8s/overlays/staging/kustomization.yaml")).toBe(true);
    expect(existsSync("infra/k8s/overlays/prod/kustomization.yaml")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tools/tests/k8s-overlays.test.ts`
Expected: FAIL because the overlays are missing.

- [ ] **Step 3: Add overlays and probe-enabled deployments**

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tools/tests/k8s-overlays.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add infra/k8s tools/tests/k8s-overlays.test.ts
git commit -m "feat: harden kubernetes delivery manifests"
```

### Task 4: Add migration, smoke test, and release docs

**Files:**
- Create: `infra/k8s/base/db-migrate-job.yaml`
- Create: `tools/smoke/smoke-test.ts`
- Create: `docs/runbooks/deploy.md`
- Test: `tools/tests/smoke-layout.test.ts`

- [ ] **Step 1: Write the failing smoke layout test**

```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("release assets", () => {
  it("includes a migration job, smoke test, and deploy runbook", () => {
    expect(existsSync("infra/k8s/base/db-migrate-job.yaml")).toBe(true);
    expect(existsSync("tools/smoke/smoke-test.ts")).toBe(true);
    expect(existsSync("docs/runbooks/deploy.md")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tools/tests/smoke-layout.test.ts`
Expected: FAIL because the release assets are missing.

- [ ] **Step 3: Add the migration job, smoke test scaffold, and deploy runbook**

```ts
export async function runSmokeTest() {
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tools/tests/smoke-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add infra/k8s/base/db-migrate-job.yaml tools/smoke docs/runbooks tools/tests/smoke-layout.test.ts
git commit -m "feat: add release and deployment runbooks"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-canvas-admin-delivery-plan.md`. Ready to execute?
