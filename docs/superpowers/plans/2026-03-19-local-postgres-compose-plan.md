# Local Postgres Compose Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local Docker Compose PostgreSQL workflow that supports Prisma and backend integration testing.

**Architecture:** Keep local development runtime assets under `infra/local`, expose simple root scripts, and document the canonical `DATABASE_URL` used by Prisma and tests.

**Tech Stack:** Docker Compose, PostgreSQL 16, pnpm, Vitest

---

## Chunk 1: Local Database Scaffold

### Task 1: Add compose file, scripts, and docs

**Files:**
- Create: `infra/local/docker-compose.yml`
- Create: `infra/local/README.md`
- Create: `tools/tests/local-postgres-compose.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing compose smoke test**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("local postgres compose", () => {
  it("defines a postgres service for local development", () => {
    const compose = readFileSync("infra/local/docker-compose.yml", "utf8");

    expect(compose).toContain("postgres:");
    expect(compose).toContain("POSTGRES_DB: canvas");
    expect(compose).toContain("5432:5432");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run tools/tests/local-postgres-compose.test.ts`
Expected: FAIL because the local compose workflow does not exist yet.

- [ ] **Step 3: Implement the local compose workflow**

Add a minimal Postgres service under `infra/local`, root scripts for `db:up` and `db:down`, and local setup instructions.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run tools/tests/local-postgres-compose.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add infra/local/docker-compose.yml infra/local/README.md tools/tests/local-postgres-compose.test.ts package.json
git commit -m "chore: add local postgres compose workflow"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-19-local-postgres-compose-plan.md`. Ready to execute?
