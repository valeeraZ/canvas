# Canvas Dashboard Widget Layout And Delete Design

Date: 2026-04-18
Status: Approved in conversation
Scope: Add layout-backed widget management to dashboard edit mode, starting with drag reorder inside the canvas and inline widget deletion
Extends:
- `/Users/sylvain/Work/canvas/docs/superpowers/specs/2026-04-17-canvas-dashboard-editor-multi-widget-ui-polish-design.md`
- `/Users/sylvain/Work/canvas/docs/superpowers/specs/2026-04-18-canvas-dashboard-default-preview-mode-design.md`

## 1. Product Summary

The dashboard editor currently supports multiple chart widgets, but the canvas is still driven by simple array order and offers no direct layout controls:

- users cannot reorder widgets visually from the canvas
- users cannot remove a widget from the place where they inspect it
- the current structure is not a good base for the next planned features such as resize, fullscreen inspection, and explicit canvas actions

This phase introduces a real widget `layout` model and uses it for the first two editing capabilities:

- drag widgets inside the dashboard canvas to change their placement
- delete widgets directly from each canvas card

The interaction stays intentionally narrow in phase 1:

- two semantic columns
- default widget size of one grid cell
- drag changes `x` and `y`
- no resize handles yet

## 2. Goals And Non-Goals

### Goals

1. Add a durable `layout` field to dashboard widgets.
2. Render the edit canvas from layout order rather than raw array order.
3. Support drag reorder inside the right-side `Dashboard canvas`.
4. Support deleting a widget directly from its canvas card.
5. Preserve compatibility for existing widgets that do not yet have layout data.
6. Keep the model extensible for future `x`, `y`, `w`, `h` editing.

### Non-Goals

- no resize interaction in this phase
- no fullscreen widget mode in this phase
- no freeform pixel positioning or collision engine
- no change to preview-mode layout behavior beyond consuming the same sorted widget order
- no redesign of widget configuration fields

## 3. Layout Model

### A. Layout is a first-class widget field

Each `DashboardWidgetRecord` gains a `layout` object that is separate from `config`.

Proposed shape:

```ts
type DashboardWidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};
```

Why separate `layout` from `config`:

- layout is canvas placement metadata, not chart semantics
- chart autosave should not need to own canvas positioning concerns
- future actions such as resize and fullscreen can evolve without polluting chart config

### B. Phase 1 layout rules

The persisted model supports future flexibility, but phase 1 constrains it to a simple two-column canvas:

- `x` is `0` or `1`
- `y` is a non-negative integer and controls vertical ordering
- `w` defaults to `1`
- `h` defaults to `1`

This two-column rule is a phase 1 canvas interpretation, not a permanent limit on the layout model. The stored `x`, `y`, `w`, `h` shape remains intentionally compatible with a future dashboard-level layout configuration such as configurable column count.

Initial widget creation uses layout-driven defaults:

- first available slot in a two-column grid
- widget width `1`
- widget height `1`

### C. Backward compatibility

Existing widgets may have no `layout` stored yet. The system must backfill a deterministic default layout on read:

- sort current widgets by stable existing order
- assign `x` and `y` as if they were placed into a two-column grid from top-left to bottom-right
- expose that normalized layout through contracts even before the widget is re-saved

This avoids migration pressure on old rows while making the frontend immediately layout-aware.

The backfill and read-path behavior should be defined through a single layout normalizer function rather than duplicated across store, route, and frontend code. That normalizer owns:

- defaulting missing layout fields
- interpreting old rows without stored layout
- producing the same normalized output shape for sorting, rendering, and persistence follow-up

## 4. Interaction Model

### A. Canvas-only drag interaction

Drag-and-drop happens inside the right-side `Dashboard canvas`, not in the widget inventory list.

Widget cards in edit mode expose:

- a visible drag handle
- an inline delete action

Phase 1 drag behavior:

- users drag a widget card to another slot in the two-column canvas
- drop updates the widget's `layout.x` and `layout.y`
- the canvas rerenders using the new layout order

Phase 1 collision behavior uses `swap` semantics:

- dragging onto an occupied slot swaps the source and target widget placements
- no push-down packing or freeform overlap is introduced in this phase

Drag should save on drop, not continuously during pointer movement. The UI should update optimistically during the drag interaction and on drop, then confirm or roll back based on the layout mutation result.

### B. Inline deletion

Each widget card in edit mode includes a delete action in the card action row.

Delete behavior:

- remove the widget from the dashboard
- compact remaining widget `y` positions into a stable two-column layout
- if the deleted widget was active, focus moves to a nearby remaining widget or clears when none remain

Because deletion is destructive, the UI should use a lightweight confirmation step rather than immediate deletion on a single accidental click.

### C. Sorting and placement

The canvas should render widgets by normalized layout order:

- sort by `y`
- then by `x`

The editor must stop relying on raw backend list order once layout exists.

## 5. API And Persistence

### A. Persistence shape

Persist widget layout alongside widget configuration, preferably as JSON on the dashboard widget row:

- current schema already stores widget `config` as JSON
- `layout` as JSON keeps the schema small while preserving future extensibility

This is enough for the current and planned near-term requirements without prematurely breaking layout into multiple columns.

### B. API surface

The editor needs two dedicated mutations:

1. Update widget layout
2. Delete widget

Recommended endpoints:

- `PATCH /dashboards/:dashboardId/widgets/:widgetId/layout`
- `DELETE /dashboards/:dashboardId/widgets/:widgetId`

Why a dedicated layout mutation:

- chart config autosave and layout persistence have different interaction timing
- drag save should remain small and explicit
- future resize updates can reuse the same layout endpoint

### C. Validation rules

Server-side validation should reject invalid phase 1 layout updates:

- `x` outside supported column range
- negative `y`
- non-positive `w` or `h`

The frontend should only send phase 1-compatible values, but server validation remains the source of truth.

## 6. Component Boundaries

### Dashboard page and preview surface

The dashboard detail route continues to orchestrate data loading.

Preview mode stays read-only and consumes the same widget records, but does not expose drag or delete affordances.

### Dashboard editor

`DashboardEditor` remains the edit-mode coordinator.

New responsibilities:

- maintain active widget when reorder or delete completes
- call layout mutation on drag end
- call delete mutation when widget deletion is confirmed

### Dashboard canvas and widget card

`DashboardCanvas` becomes the layout-driven rendering surface for edit mode.

New responsibilities:

- sort widgets by layout
- expose drag/drop affordances in edit mode
- render inline widget actions

`DashboardWidgetCard` becomes the visible home for:

- drag handle
- delete button
- future action row items such as fullscreen

This keeps widget-level affordances visually close to the chart they affect.

## 7. Testing Strategy

### Store and repository tests

Add tests that prove:

1. widgets without stored layout receive deterministic default layout
2. created widgets receive default layout values
3. layout updates persist valid `x`, `y`, `w`, `h`
4. deleting a widget compacts remaining layout ordering
5. the shared layout normalizer produces the same output for old rows and partially missing layout fields

### API tests

Add route tests that prove:

1. layout patch succeeds for valid phase 1 input
2. invalid layout input is rejected
3. delete removes the widget and returns a stable response

### Frontend component tests

Add tests that prove:

1. canvas renders widgets in layout order
2. edit-mode cards show drag and delete controls
3. dragging onto an occupied slot produces phase 1 `swap` behavior
4. deleting the active widget updates focus predictably
5. preview mode does not expose edit-only actions
6. optimistic layout updates roll back on mutation failure

### Browser acceptance

Extend the real-chart dashboard acceptance flow to prove:

- a dashboard can show multiple widgets
- widget order changes through drag-and-drop in edit mode
- dragging onto an occupied slot swaps widget positions
- a widget can be deleted from the canvas
- the resulting layout persists on reload

## 8. Risks And Guardrails

### Risk: mixing config autosave and layout save

Chart config edits and drag operations happen on different cadences. Keeping layout mutations separate avoids noisy saves and makes failure states easier to understand.

### Risk: inconsistent default layout logic

If old rows are normalized differently across store, route, and UI code, widget order will drift between refreshes and mutations. A single normalizer function is required to keep layout interpretation consistent.

### Risk: undefined collision semantics

If the drag target behavior is not explicit, different layers may implement different reorder expectations. Phase 1 should lock collision handling to `swap` so browser, component, and persistence tests all assert the same result.

### Risk: unstable compaction after delete

If delete leaves gaps or compacts inconsistently, widget order will appear to jump. The compaction rules must be deterministic and shared across store and frontend expectations.

### Risk: overbuilding a layout engine too early

The model should be future-compatible, but implementation should stay phase-1-simple:

- two columns
- fixed default size
- no collision solver
- no resize yet

This keeps the change shippable while preserving the right long-term shape.
