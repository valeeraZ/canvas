# Dashboard Widget Resize Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add widget enlarge/shrink controls in the dashboard editor so canvas cards can toggle between single-column and double-column width using the existing layout mutation path.

**Architecture:** Extend the shared widget layout helpers so compacted layout placement understands `layout.w`, then reuse that logic in both the editor optimistic update path and the canvas preview/render path. Keep the scope intentionally narrow by supporting width toggles only, preserving `h = 1`, and persisting through the existing `PATCH /widgets/:id/layout` endpoint.

**Tech Stack:** TypeScript, React 19, Next.js app router, Vitest, shared contracts/db layout helpers

---

## Chunk 1: Resize Semantics

### Task 1: Define failing helper tests

**Files:**
- Modify: `packages/db/src/dashboard-widget-store.test.ts`
- Modify: `apps/web/src/components/portal/dashboard-editor.test.tsx`
- Modify: `apps/web/src/components/portal/dashboard-canvas.test.tsx`

- [ ] **Step 1: Write failing tests for compact resize behavior**
- [ ] **Step 2: Run targeted tests to verify the new assertions fail for missing resize support**

### Task 2: Implement shared resize helper behavior

**Files:**
- Modify: `packages/db/src/dashboard-widget-layout.ts`
- Modify: `packages/db/src/dashboard-widget-store.ts`

- [ ] **Step 1: Add helper(s) that compact widgets while respecting width spans**
- [ ] **Step 2: Reuse the helper in layout persistence so resize updates compact neighbors predictably**
- [ ] **Step 3: Run targeted db tests to verify green**

## Chunk 2: Editor And Canvas Controls

### Task 3: Add UI controls and optimistic resize flow

**Files:**
- Modify: `apps/web/src/components/portal/dashboard-widget-card.tsx`
- Modify: `apps/web/src/components/portal/dashboard-canvas.tsx`
- Modify: `apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Render enlarge/shrink controls on editable widget cards**
- [ ] **Step 2: Apply `layout.w` to canvas grid span rendering**
- [ ] **Step 3: Add optimistic resize handling with rollback on mutation failure**
- [ ] **Step 4: Run targeted web tests to verify green**

## Chunk 3: Verification

### Task 4: Run focused verification

**Files:**
- Modify: `docs/superpowers/plans/2026-04-20-canvas-dashboard-widget-resize-plan.md`

- [ ] **Step 1: Run `corepack pnpm vitest packages/db/src/dashboard-widget-store.test.ts apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`**
- [ ] **Step 2: Record any follow-up gaps if broader integration tests are still unrun**
