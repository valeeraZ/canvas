# Canvas Embed SDK Viewer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refocus SDK to viewer use-cases: list visible dashboards, let user select one, and render selected dashboard in host apps.

**Architecture:** Keep session bootstrap and route wiring in `packages/embed-sdk`, remove builder-first assumptions from SDK-facing flows, and add app-scoped viewer APIs/hooks.

**Tech Stack:** React, TypeScript, Next.js integration, TanStack Query, Vitest

---

## Chunk 1: Viewer API Contracts and Hooks

### Task 1: Add visible dashboards API client methods

**Files:**
- Modify: `packages/embed-sdk/src/lib/api-client.ts`
- Create: `packages/contracts/src/embed-viewer.ts`
- Modify: `packages/contracts/src/index.ts`
- Test: `packages/embed-sdk/src/lib/api-client.test.ts`

- [ ] **Step 1: Write failing API client test for visible dashboard endpoints**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run packages/embed-sdk/src/lib/api-client.test.ts`
Expected: FAIL due to missing viewer methods/contracts.
- [ ] **Step 3: Implement viewer endpoint client functions**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run packages/embed-sdk/src/lib/api-client.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/embed-sdk/src/lib/api-client.ts packages/embed-sdk/src/lib/api-client.test.ts packages/contracts/src/embed-viewer.ts packages/contracts/src/index.ts
git commit -m "feat: add sdk viewer api contracts"
```

### Task 2: Add hooks for visible dashboards and selected dashboard

**Files:**
- Create: `packages/embed-sdk/src/hooks/use-visible-dashboards.ts`
- Create: `packages/embed-sdk/src/hooks/use-selected-dashboard.ts`
- Test: `packages/embed-sdk/src/hooks/use-visible-dashboards.test.ts`

- [ ] **Step 1: Write failing hook tests**
- [ ] **Step 2: Run tests to verify failures**
Run: `corepack pnpm vitest run packages/embed-sdk/src/hooks/use-visible-dashboards.test.ts`
Expected: FAIL because hooks are missing.
- [ ] **Step 3: Implement viewer hooks**
- [ ] **Step 4: Run tests to verify pass**
Run: `corepack pnpm vitest run packages/embed-sdk/src/hooks/use-visible-dashboards.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/embed-sdk/src/hooks/use-visible-dashboards.ts packages/embed-sdk/src/hooks/use-selected-dashboard.ts packages/embed-sdk/src/hooks/use-visible-dashboards.test.ts
git commit -m "feat: add sdk viewer selection hooks"
```

## Chunk 2: SDK Viewer UI

### Task 3: Add dashboard picker component for host apps

**Files:**
- Create: `packages/embed-sdk/src/features/dashboards/dashboard-picker.tsx`
- Create: `packages/embed-sdk/src/features/dashboards/dashboard-picker.test.tsx`
- Modify: `packages/embed-sdk/src/routes/dashboard-screen.tsx`

- [ ] **Step 1: Write failing dashboard-picker test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run packages/embed-sdk/src/features/dashboards/dashboard-picker.test.tsx`
Expected: FAIL because component is missing.
- [ ] **Step 3: Implement picker and route integration**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run packages/embed-sdk/src/features/dashboards/dashboard-picker.test.tsx`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/embed-sdk/src/features/dashboards/dashboard-picker.tsx packages/embed-sdk/src/features/dashboards/dashboard-picker.test.tsx packages/embed-sdk/src/routes/dashboard-screen.tsx
git commit -m "feat: add sdk dashboard picker"
```

### Task 4: Remove builder-first exports from SDK entrypoint

**Files:**
- Modify: `packages/embed-sdk/src/index.ts`
- Modify: `packages/embed-sdk/src/routes/dashboard-screen.tsx`
- Test: `packages/embed-sdk/src/index.test.ts`

- [ ] **Step 1: Write failing index export test**
- [ ] **Step 2: Run test to verify failure**
Run: `corepack pnpm vitest run packages/embed-sdk/src/index.test.ts`
Expected: FAIL because old builder-oriented export contract remains.
- [ ] **Step 3: Update SDK exports for viewer-first contract**
- [ ] **Step 4: Run test to verify pass**
Run: `corepack pnpm vitest run packages/embed-sdk/src/index.test.ts`
Expected: PASS.
- [ ] **Step 5: Commit**
```bash
git add packages/embed-sdk/src/index.ts packages/embed-sdk/src/routes/dashboard-screen.tsx packages/embed-sdk/src/index.test.ts
git commit -m "refactor: make sdk dashboard surface viewer-first"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-22-canvas-embed-sdk-viewer-plan.md`. Ready to execute?
