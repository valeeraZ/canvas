# Canvas Dashboard Editor Real Chart UI Design

Date: 2026-04-16
Status: Draft approved in conversation
Scope: Dashboard editor phase 1.5, focused on rendering real imported data in the editor UI
Extends: `/Users/sylvain/Work/canvas/docs/superpowers/specs/2026-04-01-canvas-dashboard-editor-chart-design.md`
Depends on: `/Users/sylvain/Work/canvas/docs/superpowers/specs/2026-04-16-canvas-fixed-dataset-rows-design.md`

## 1. Product Summary

Canvas already has:

- dashboard widgets and widget config persistence
- dataset preview loading for editor field selection
- fixed-table dataset row storage through `DatasetRow`
- a narrow query layer that can aggregate real imported rows

What is still missing is the part users can actually see: the dashboard editor canvas is still rendering charts from `preview.records` instead of querying imported dataset rows.

This phase makes the dashboard editor show real chart output from imported data as soon as possible, while keeping the current asynchronous ingestion pipeline and existing three-column editing shell.

## 2. Goals And Non-Goals

### Goals

1. Render the editor's main chart area from real imported dataset rows, not local preview records.
2. Keep the existing editor shell structure:
   - left widget inventory
   - center real chart area
   - right config panel
3. Use shadcn chart composition for the rendered chart UI.
4. Keep dataset preview as the source for field dropdowns and type hints only.
5. Support only `bar`, `line`, and `area` in this phase.
6. Show clear editor states for loading, import-in-progress, invalid field selection, and empty results.

### Non-Goals

- no `pie` rendering in this phase
- no `seriesField` split rendering in this phase
- no new widget types
- no drag-and-drop layout redesign
- no full semantic layer or general BI query builder
- no replacement of Redis-backed ingestion or worker flow

## 3. Editor Experience

The `Overview` tab keeps the current three-column editor structure, but its center panel becomes a real chart workspace instead of a preview-derived multi-widget grid.

### Left column: widget inventory

- Keep the existing widget list and `Add chart` action.
- Clicking a widget selects it as the active editing target.
- The list remains the place where users switch between widgets.

### Center column: active chart workspace

- Show one active widget at a time.
- If the active widget is fully configured and queryable, render a real chart from backend query results.
- If the widget is incomplete or cannot be queried, show a status card in the same place instead of a fake chart.

Required user-facing states:

- `Loading chart...`
- `Dataset still importing`
- `Field not queryable`
- `No rows returned`

### Right column: widget configuration

- Keep the current config panel placement.
- Continue using dataset preview metadata to populate field dropdowns.
- Restrict chart type choices to `bar`, `line`, and `area`.
- Keep `pie` and `seriesField` visibly unavailable in phase 1 instead of pretending they work.

## 4. Data Read Model

The editor now has two separate read paths with different responsibilities.

### A. Dataset preview path

Purpose:

- field dropdown options
- field type hints
- default axis selection
- lightweight empty-state guidance

Source:

- `Dataset.preview`

This path must not be used as the main chart rendering datasource anymore.

### B. Chart query path

Purpose:

- return aggregated chart payload built from real imported rows in `DatasetRow`

Input shape:

- `datasetId`
- `chartType`
- `xField`
- `yField`

Optional widget context such as `widgetId` or `title` can stay on the frontend for UI purposes, but is not required to execute the query in phase 1.

Output shape:

- continue moving toward the shared chart contract in `packages/contracts/src/charts.ts`
- payload remains label-plus-series oriented so the web layer can adapt it into shadcn chart components

## 5. Backend Shape

Phase 1 adds a dedicated dataset-scoped chart query endpoint instead of making the editor build charts from local preview rows.

Recommended route shape:

- `POST /datasets/:datasetId/chart-query`

Behavior:

1. validate tenant scope and dataset access
2. validate selected fields against dataset preview columns
3. execute the fixed-table query path using `datasetId`
4. map grouped query rows into shared chart payload
5. return only supported chart types for this phase

Implementation should reuse the existing narrow query pipeline where practical:

- `runQuery`
- `runChartQuery`
- shared chart payload mapping helpers

The backend must return explicit empty results instead of synthesizing fake data.

## 6. Frontend Shape

### Page data loading

The dashboard detail page continues to server-render:

- dashboard metadata
- widget list
- dataset list
- dataset previews

It does not need to prefetch real chart payloads for this phase.

### Chart fetching

The active chart renderer becomes responsible for requesting real chart data when:

- the selected widget changes
- `datasetId`, `chartType`, `xField`, or `yField` changes

This keeps the first visible UI milestone small and avoids turning the entire page into a bulk chart prefetcher.

### Rendering technology

The visual chart should use shadcn chart composition, which in practice means:

- `ChartContainer`
- `ChartTooltip`
- `ChartTooltipContent`
- `ChartLegend`
- `ChartLegendContent`

under a thin adapter that still renders through Recharts primitives inside the shadcn wrapper.

### Renderer boundary

The web renderer should consume a real chart payload and adapt it to the selected shadcn chart presentation.

That means:

- stop deriving the main chart from `preview.records`
- keep a dedicated adapter layer
- make chart-type switching live inside the renderer boundary, not inside the page shell

## 7. Supported And Deferred Configuration

### Supported now

- dataset selection
- chart title
- `bar`
- `line`
- `area`
- `xField`
- `yField`

### Deferred for later

- `pie`
- `seriesField`
- multi-series grouped rendering from categorical split

The UI should communicate these as not yet available instead of silently ignoring them.

## 8. Error And Loading Handling

The chart workspace should distinguish between:

- loading query
- dataset not yet imported
- selected field not allowed for query
- query returned zero grouped rows
- generic request failure with existing safe error messaging

Portal-safe error behavior remains unchanged:

- show generic request failure text to the user
- preserve `Request ID`
- do not expose SQL, Prisma details, or stack traces

## 9. Testing Strategy

### Backend

- route test for dataset-scoped chart query endpoint
- unit test for `runChartQuery` payload behavior
- validation test for unsupported fields or unsupported chart types

### Web

- proxy route test for chart query forwarding
- portal API client test for chart query calls
- chart renderer test for loading, empty, and success states
- dashboard editor test covering active-widget real chart flow
- config panel test confirming `pie` and `seriesField` are disabled/deferred

## 10. Completion Signal

This phase is complete when:

1. an imported dataset can be selected in the dashboard editor
2. the center chart workspace renders from real backend query output
3. the chart uses shadcn chart composition
4. preview data is still used for field selection but not as the main chart datasource
5. `pie` and `seriesField` are clearly deferred
6. focused tests and web build pass
