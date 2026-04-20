# Canvas Dashboard Widget Push Reorder Design

Date: 2026-04-19
Status: Approved in conversation
Scope: Replace edit-mode widget drag swap semantics with sequence-based insertion and push-down compaction in the dashboard canvas
Extends:
- `/Users/sylvain/Work/canvas/docs/superpowers/specs/2026-04-18-canvas-dashboard-widget-layout-delete-design.md`

## 1. Product Summary

The dashboard editor currently treats drag reorder as a layout swap:

- dragging widget C onto widget A moves C into A's slot
- widget A moves directly into C's old slot
- intermediate widgets do not shift

That behavior makes the canvas feel mechanical rather than grid-native. The user wants drag reorder to behave like inserting a card into a two-column reading-order sequence:

- dragging widget C to the first slot makes C become the first card
- the prior first card shifts right into the second slot
- the prior second card shifts down into the next row

This design changes drag reorder from slot swap to sequence insertion while keeping the existing two-column layout model.

## 2. Goals And Non-Goals

### Goals

1. Make drag preview animate as a smooth push-down reorder instead of a swap.
2. Persist the same insertion semantics on drop so saved state matches preview state.
3. Keep the two-column layout model and layout normalization rules already introduced.
4. Share one reorder algorithm across frontend preview and backend persistence.

### Non-Goals

- no freeform collision engine
- no widget resize behavior
- no variable widget span support beyond existing `w` and `h` storage
- no change to read-only preview mode controls

## 3. Interaction Model

### A. Sequence-based insertion

The canvas keeps using two semantic columns, but drag targeting is interpreted through reading order:

1. normalize widgets into a stable ordered list by `y`, then `x`
2. remove the dragged widget from that list
3. insert it at the target widget's current list index
4. compact the list back into default two-column slots

This means reorder is defined by list position, not by direct coordinate exchange.

### B. Example behavior

Given three widgets in reading order:

- `A @ (0,0)`
- `B @ (1,0)`
- `C @ (0,1)`

Dragging `C` over `A` yields:

- `C @ (0,0)`
- `A @ (1,0)`
- `B @ (0,1)`

Dragging `A` over `C` yields:

- `B @ (0,0)`
- `C @ (1,0)`
- `A @ (0,1)`

### C. Preview and persistence must match

The drag interaction should never preview one layout rule and save another. The same reorder helper must therefore drive:

- hover preview ordering in `DashboardCanvas`
- optimistic editor state updates after drop
- persisted layout updates in the widget store

## 4. Technical Design

### A. Shared reorder helper

The canonical helper should live with the existing layout utilities in `packages/db/src/dashboard-widget-layout.ts`.

Recommended shape:

```ts
reorderDashboardWidgetLayouts(widgets, draggedWidgetId, targetWidgetId)
```

Behavior:

- normalize and sort all widgets
- no-op if source or target is missing, or identical
- compute insertion order in the sorted list
- assign compacted default grid layouts after insertion

This replaces the current swap-only helper for reorder use cases. Delete compaction can keep relying on the same compacted-grid model.

### B. Frontend usage

`DashboardCanvas` should use the shared insertion helper for hover preview instead of `previewDashboardCanvasSwap`.

`DashboardEditor` should use the same helper for optimistic drop state instead of `applyWidgetLayoutSwap`.

The visual smoothness improvement should come from preserving a stable DOM order and letting the cards transition between compacted layout positions rather than instantly exchanging places.

### C. Persistence usage

The widget store currently updates layout through occupied-slot swap semantics. That should change to:

- load all dashboard widgets
- compute reordered layouts using the shared insertion helper and the requested target slot
- persist every affected widget layout in one update transaction

This keeps backend state aligned with the frontend preview.

## 5. Testing Strategy

Add focused tests for:

1. layout helper reorder on a three-widget two-row example
2. no-op behavior for invalid drag inputs
3. canvas preview order after dragging the third widget over the first
4. editor optimistic reorder using insertion semantics
5. store persistence updating all impacted widgets instead of swapping only source and target

## 6. Risks And Mitigations

### Risk: frontend preview and saved layout diverge

Mitigation:
- move reorder logic into shared layout helpers
- test the same scenario at helper, editor, and store layers

### Risk: drag hover feels jumpy

Mitigation:
- only recompute preview from the current drag source and target
- keep compacted layout ordering stable
- use transform/transition styling on widget cards if current CSS is too abrupt
