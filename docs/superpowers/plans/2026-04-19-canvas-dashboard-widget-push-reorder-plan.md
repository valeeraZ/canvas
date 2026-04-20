# Canvas Dashboard Widget Push Reorder Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dashboard edit-mode widget drag swap behavior with sequence-based insertion so widgets push each other through the two-column grid during preview and after save.

**Architecture:** Introduce one shared reorder helper that treats the normalized two-column layout as a reading-order sequence, then reuse it in frontend drag preview, editor optimistic updates, and backend layout persistence. Keep the existing layout normalization and delete compaction model intact so this change stays focused on reorder semantics.

**Tech Stack:** React 19, Next.js App Router, TypeScript, Vitest, Fastify, Prisma

---

## File Structure

- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-layout.ts`
  - Replace swap-specific reorder behavior with sequence-based insertion helpers.
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.ts`
  - Persist reordered layouts for all impacted widgets instead of swapping only two records.
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.test.ts`
  - Add red/green coverage for push-down reorder persistence.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.tsx`
  - Use insertion semantics for drag preview.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.test.tsx`
  - Cover the third-widget-to-first-slot preview behavior.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`
  - Use the shared reorder helper for optimistic state after drop.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
  - Cover insertion-based optimistic ordering.
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-widget-card.tsx`
  - Add transition styling only if needed to support smoother movement without changing behavior.

## Chunk 1: Shared Reorder Semantics

### Task 1: Write failing layout helper and store tests

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.test.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-layout.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.ts`

- [ ] **Step 1: Write the failing tests**

Add tests proving:
- dragging the third widget onto the first yields order `3,1,2`
- layouts compact back to `(0,0)`, `(1,0)`, `(0,1)`
- invalid source or target ids produce a no-op

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts`
Expected: FAIL because reorder still swaps source and target layouts.

- [ ] **Step 3: Implement the minimal shared reorder helper**

Add or replace helpers so reorder:
- sorts widgets by normalized layout
- removes the dragged widget
- inserts it at the target position
- compacts the sequence back into default two-column slots

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts`
Expected: PASS

## Chunk 2: Frontend Preview And Optimistic Drop

### Task 2: Write failing canvas and editor tests

**Files:**
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.test.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Write the failing tests**

Add tests proving:
- canvas preview for dragging widget 3 over widget 1 yields order `3,1,2`
- optimistic editor reorder uses the same resulting layouts

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: FAIL because the UI helpers still use swap semantics.

- [ ] **Step 3: Implement the minimal UI changes**

Update preview and optimistic state helpers to call the insertion-based reorder helper. Add card transitions only if current movement still feels abrupt after the semantic fix.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm exec vitest run apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

## Chunk 3: Focused Verification

### Task 3: Run focused regression checks

**Files:**
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-layout.ts`
- Modify: `/Users/sylvain/Work/canvas/packages/db/src/dashboard-widget-store.ts`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-canvas.tsx`
- Modify: `/Users/sylvain/Work/canvas/apps/web/src/components/portal/dashboard-editor.tsx`

- [ ] **Step 1: Run the focused test set**

Run: `corepack pnpm exec vitest run packages/db/src/dashboard-widget-store.test.ts apps/web/src/components/portal/dashboard-canvas.test.tsx apps/web/src/components/portal/dashboard-editor.test.tsx`
Expected: PASS

- [ ] **Step 2: Inspect for unintended swap references**

Run: `rg -n "swap.*layout|LayoutSwap|CanvasSwap" packages/db/src apps/web/src/components/portal`
Expected: remaining swap references are either removed or renamed where behavior changed.

- [ ] **Step 3: Summarize residual risk**

Document whether browser-level drag animation was improved enough by semantic changes alone, or whether a later CSS/positioning pass is still warranted.
