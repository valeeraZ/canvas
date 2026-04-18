# Canvas Dashboard Default Preview Mode Design

Date: 2026-04-18
Status: Approved in conversation
Scope: Change the dashboard detail entry experience from immediate editing to default preview/view mode
Extends:
- `/Users/sylvain/Work/canvas/.worktrees/dashboard-editor-multi-widget-ui/docs/superpowers/specs/2026-04-17-canvas-dashboard-editor-multi-widget-ui-polish-design.md`

## 1. Product Summary

The current dashboard detail page opens directly into the editor. That is efficient for frequent authors, but it gives the wrong default posture for most visits:

- users land in an editing environment before they decide to edit
- configuration controls dominate the page even when the goal is only to inspect the dashboard
- the current page mixes authoring and consumption concerns too early

This phase changes the default entry mode:

- opening a dashboard shows a preview/view mode by default
- preview mode focuses on dashboard widgets and their linked datasets
- editing becomes an explicit action through an `Edit dashboard` affordance

## 2. Goals And Non-Goals

### Goals

1. Default dashboard detail visits to preview/view mode.
2. Keep the current editor available behind an explicit mode switch.
3. Show the dashboard widgets in preview mode using the real chart rendering path.
4. Show the linked dataset name and source filename for each widget when available.
5. Make dataset metadata actionable by linking directly to the dataset detail page.

### Non-Goals

- no new permission model between viewing and editing
- no separate persisted user preference for last-used mode
- no new edit route in this phase
- no dataset preview table inside dashboard preview mode
- no redesign of sharing or import/export workflows

## 3. Interaction Model

### A. Default mode is preview

Opening `/portal/dashboards/[dashboardId]` without an explicit mode parameter renders preview mode.

Preview mode behavior:

- show dashboard widgets only
- hide widget configuration controls
- hide the authoring-focused widget list
- avoid editing-state copy such as `Editing`, `Saving...`, or grouped config sections

The page should feel like a dashboard inspection surface, not an editor.

### B. Editing is explicit

Preview mode exposes a clear `Edit dashboard` action in the page header.

Selecting that action switches the page into edit mode, where the existing `DashboardEditor` experience is reused.

Edit mode also exposes a reciprocal `Back to preview` or `Done` action so the user can leave authoring mode intentionally.

### C. Mode switching mechanism

Mode state is controlled by the URL query string:

- default: no `mode` query param or any unrecognized value => preview mode
- edit mode: `?mode=edit`

Why this direction:

- stable and shareable URL behavior
- server-render-friendly
- no extra client-only mode state to reconcile on refresh
- minimal scope increase compared with introducing a second route

## 4. Preview Mode Content

### A. Widget-first layout

Preview mode should emphasize the dashboard itself:

- render the dashboard widgets in the main content area
- preserve the multi-widget overview model from the existing editor work
- keep the visual layout simpler than edit mode by removing the left inventory column and right config panel

The preview layout does not need focus selection because there is no active editing target.

### B. Dataset summary per widget

Each widget card shows its linked dataset summary when a dataset is attached:

- dataset display name
- source filename

Both pieces of dataset metadata should link to the dataset detail page:

- `/portal/datasets/[datasetId]`

If the source filename is missing, show a fallback such as `No source file recorded`.

If no dataset is linked, show a neutral empty state such as `No dataset linked`.

### C. Dataset lookup model

The dashboard detail page already loads the dataset list. Preview mode needs one additional metadata field not available in the list response:

- `sourceFilename`

To keep the change narrow:

- derive the set of dataset IDs referenced by dashboard widgets
- fetch `getDataset(datasetId)` only for those linked datasets
- build a per-dataset metadata map for preview rendering

This avoids loading full dataset details for unrelated datasets.

## 5. Component Boundaries

### Portal dashboard page

The route component remains the orchestrator for server data loading and mode selection.

Responsibilities:

- read search params
- determine preview versus edit mode
- fetch dashboard, widgets, dataset list, and linked dataset details
- pass the correct props to the chosen child surface

### Preview component

Introduce a dedicated preview component rather than overloading `DashboardEditor`.

Responsibilities:

- render a read-only multi-widget dashboard surface
- compose widget cards with chart rendering and dataset summary
- expose no mutation callbacks

This keeps editing complexity out of the preview path.

### Existing editor

`DashboardEditor` remains edit-mode only.

Responsibilities stay unchanged:

- widget focus
- auto-save configuration
- widget-scoped save and chart-query state

This avoids weakening the current editor abstractions by forcing them to also behave as a read-only preview shell.

## 6. Testing Strategy

### Page-level tests

Add route tests that prove:

1. default detail rendering uses preview mode
2. `?mode=edit` renders the editor
3. preview mode shows linked dataset name and source filename

### Component tests

Add preview component tests that prove:

1. widgets render in read-only mode
2. linked dataset metadata is shown
3. missing dataset links or missing filenames show the correct fallback copy

### Browser acceptance

Update the existing dashboard acceptance flow to reflect the new entry behavior:

- landing on dashboard detail now shows preview mode
- user explicitly enters edit mode before changing widget config

Add a preview-mode browser check that confirms:

- widgets are visible without edit controls
- dataset metadata links are visible

## 7. Risks And Guardrails

### Risk: duplicating too much widget UI

The preview experience needs the same chart rendering path as edit mode. The implementation should reuse the existing widget card and chart renderer where possible, but without leaking edit-only affordances into preview mode.

### Risk: overfetching dataset details

Fetching full dataset details for every dataset in the app would be wasteful. Restrict detail fetches to the datasets actually linked by the current dashboard widgets.

### Risk: mode confusion in tests

Because preview becomes the default, existing editor tests and browser flows must explicitly opt into `?mode=edit` where they depend on authoring controls.
