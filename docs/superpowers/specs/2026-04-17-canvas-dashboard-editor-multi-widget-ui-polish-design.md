# Canvas Dashboard Editor Multi-Widget UI Polish Design

Date: 2026-04-17
Status: Draft approved in conversation
Scope: Dashboard editor phase 2, focused on multi-widget canvas editing and higher-efficiency configuration UX
Extends:
- `/Users/sylvain/Work/canvas/docs/superpowers/specs/2026-04-16-canvas-dashboard-editor-real-chart-ui-design.md`

## 1. Product Summary

The dashboard editor now has a real chart-query path and can render imported data in the editor. What it still lacks is a practical editing surface for dashboards with more than one chart widget.

The current editor is effectively single-widget focused:

- the center column shows one active chart only
- the left list is the only meaningful multi-widget surface
- the right form uses explicit save flow, which adds friction when editing several widgets in sequence

This phase upgrades the editor into a true multi-widget editing workspace:

- the center column becomes a rules-based dashboard canvas that shows multiple chart widgets at once
- one widget is still the current editing focus
- the right panel becomes an auto-saving, low-friction configuration surface for the focused widget

## 2. Goals And Non-Goals

### Goals

1. Show multiple chart widgets in the same dashboard editor canvas at the same time.
2. Keep one focused widget for editing without hiding the rest of the dashboard.
3. Improve configuration efficiency with auto-save and clearer field grouping.
4. Preserve real chart rendering for each visible widget.
5. Keep widget-level loading, saving, empty, and error states isolated.

### Non-Goals

- no freeform drag-and-drop layout system in this phase
- no resizable widget canvas or masonry layout
- no table, metric, or text widget editing upgrades
- no semantic-layer redesign
- no cross-dashboard bulk editing

## 3. Interaction Model

### A. Center canvas: overview plus focus

The editor center column becomes a `Dashboard canvas` surface instead of a single `Active chart` card.

Behavior:

- render all chart widgets in a rules-based grid
- all widget cards use a shared base size and shared internal layout rhythm
- clicking any widget card sets that widget as the current focus
- focused state changes the right panel contents immediately
- the focused card stays visible in the grid instead of expanding into a separate full-width view

This keeps the dashboard readable as a whole while still supporting focused editing.

### B. Left column: inventory, not primary preview

The widget list stays in the left column, but its role changes:

- continue to host `Add chart`
- continue to list widgets
- selecting a list item performs the same action as clicking a card in the center canvas

The left column is no longer the only meaningful multi-widget view.

### C. Right column: always edits the focused widget

The right panel always binds to the currently focused widget.

The panel header shows enough context to avoid ambiguity:

- widget title or fallback name
- chart type badge
- dataset name when available
- save state text such as `Saving...`, `Saved`, or `Save failed`

## 4. Canvas Layout And Visual Rules

### Rules-based grid

The center canvas uses a fixed rhythm grid:

- uniform card footprint for all widgets in phase 1
- stable column count responsive to viewport width
- consistent spacing between cards

Why this direction:

- users can compare widgets faster
- the layout stays stable while editing
- implementation remains aligned with the current dashboard shell

### Widget card structure

Each widget card contains:

1. top metadata row
2. main chart area
3. bottom support row

Top metadata row:

- title
- chart type badge
- optional focused-state affordance

Main chart area:

- real chart rendering through the existing chart renderer path
- local widget loading/empty/error handling

Bottom support row:

- dataset name
- saving state or request status when relevant

### Focused card treatment

The focused widget is emphasized without breaking the grid:

- stronger border or accent ring
- subtle background shift
- small `Editing` or equivalent state marker

Non-focused cards remain fully readable and interactive.

## 5. Configuration Efficiency

### Grouped panel structure

The right panel is reorganized into compact groups:

- `Chart`
- `Data`
- `Meta`

Recommended field placement:

- `Chart`: chart type
- `Data`: dataset, x field, y field
- `Meta`: title and future low-priority fields

This creates a predictable scan path when moving between widgets.

### Auto-save behavior

The panel moves from explicit save to automatic persistence.

Recommended save model:

- select-driven fields save immediately on change
- text fields use a short debounce before save
- no primary `Save widget` button in the main flow

Immediate-save fields:

- chart type
- dataset
- x field
- y field

Debounced-save fields:

- title

### Save feedback

Auto-save must stay visible and local.

Show save state in two places:

- right panel header
- focused widget card

Required save states:

- `Saving...`
- `Saved`
- `Save failed`

On failure:

- keep the latest local value visible
- do not roll the user back to stale persisted values
- allow the next edit to retry naturally

## 6. Data And State Flow

### Page data

The page continues to server-render:

- dashboard metadata
- widget list
- dataset list
- dataset previews

### Client editing state

The client editor adds focused-widget state plus per-widget request state.

Suggested state separation:

- `focusedWidgetId`
- per-widget chart query state
- per-widget save state
- per-widget local draft state for debounced text fields

This avoids whole-page loading flashes when editing one widget.

### Chart refreshing

When a persisted chart-driving field changes, only the affected widget should:

- enter saving state
- refresh its chart query state after save success

Other widgets must stay visually stable.

## 7. Error, Empty, And Loading Handling

### Widget-scoped states

The center canvas must treat widget states locally, not globally.

Each widget card may independently show:

- chart loading
- dataset importing
- empty query results
- field invalid
- request failure
- save failure

One broken widget must not block the rest of the dashboard canvas.

### Panel-scoped states

The right panel reflects save failures for the currently focused widget only.

If focus changes:

- panel updates to the newly focused widget
- previous widget state remains visible on that widget card

## 8. Testing Strategy

### Web component and integration tests

- editor test covering multi-widget canvas rendering
- focus switching test from center card to right panel
- widget list and center card selection equivalence test
- auto-save test for chart type and field changes
- debounced title save test
- isolated widget save error test

### Browser acceptance

At least one browser-level acceptance flow should cover:

1. dashboard with multiple widgets visible at once
2. selecting different cards changes the current editing context
3. right panel changes auto-save the target widget
4. affected widget chart re-renders from real backend chart-query data

## 9. Completion Signal

This phase is complete when:

1. one dashboard can show multiple real chart widgets in the center canvas
2. the editor maintains one focused widget without hiding the others
3. the right panel is grouped for faster editing
4. chart-driving fields auto-save and refresh the correct widget
5. title edits debounce-save without blocking further editing
6. save and chart states remain widget-local
7. focused automated tests and browser acceptance pass
