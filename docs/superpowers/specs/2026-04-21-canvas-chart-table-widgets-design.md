# Canvas Chart And Table Widgets Design

## Context

The dashboard editor currently renders real chart widgets for `bar`, `line`, and `area` through the dataset chart-query path. The widget type model already includes `table`, and the dashboard editor config contract already mentions `pie`, but the query contract, backend validation, API client, renderer, and editor controls still restrict real chart rendering to the first three chart types.

This phase expands the existing chart pipeline and adds a distinct table widget path with paginated dataset rows.

## Goals

1. Support `pie`, `radar`, and `radial` chart widgets alongside `bar`, `line`, and `area`.
2. Keep chart data semantics simple: group by `xField`, sum `yField`, and render the result according to chart type.
3. Add table widgets as a first-class dashboard widget type with their own config.
4. Render table widgets with pagination in the dashboard canvas.
5. Record additional widget ideas for later phases without implementing them now.

## Non-Goals

- No multi-series split implementation in this phase.
- No pivot table, filtering, sorting, or column formatting in this phase.
- No new database tables or Prisma schema changes.
- No dashboard-wide cross-filtering or drilldown.

## Chart Design

The shared chart contract expands `SupportedChartQueryType` to include:

- `bar`
- `line`
- `area`
- `pie`
- `radar`
- `radial`

The backend chart query path continues to validate `xField` and `yField` against the dataset preview columns, then returns the same label-plus-series payload shape. This keeps the API stable and lets the web renderer choose the Recharts primitive from `chartType`.

Rendering maps the current payload as follows:

- `bar`: grouped labels on the X axis, summed values on the Y axis.
- `line`: grouped labels on the X axis, summed values on the Y axis.
- `area`: grouped labels on the X axis, summed values on the Y axis.
- `pie`: one slice per label using the first series value.
- `radar`: one radar polygon using labels as angular categories and the first series values.
- `radial`: one radial bar per label using the first series value.

## Table Design

Table widgets get a separate config shape:

```ts
export type TableWidgetConfig = {
  datasetId: string;
  columns: string[];
  pageSize: number;
  title?: string;
};
```

The dashboard widget record config becomes a union by widget type. Chart widgets continue using `ChartWidgetConfig`; table widgets use `TableWidgetConfig`.

The dashboard editor adds table widget creation and routes table widgets through a new table renderer instead of the chart renderer. The table renderer requests paginated dataset rows and displays:

- selected columns
- current page rows
- previous/next pagination controls
- a compact row count summary

The paginated row endpoint returns only the requested page:

```ts
export type TableRowsPayload = {
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
  page: number;
  pageSize: number;
  totalRows: number;
};
```

## Editor Behavior

The config panel switches by widget type:

- Chart widgets show chart type, dataset, X field, Y field, title, and the existing future series placeholder.
- Table widgets show dataset, visible columns, page size, and title.

Existing chart widgets remain compatible. Any unknown or legacy chart type falls back only at UI draft creation time; persisted supported chart types are preserved.

## Error Handling

Chart widgets keep the existing status model: idle, loading, dataset importing, field invalid, empty, and error.

Table widgets use a parallel state model: idle, loading, dataset importing, field invalid, empty, error, and ready. Invalid table columns are reported before querying when preview metadata is available.

## Future Widget Backlog

Later phases can add:

- combo chart
- stacked bar
- stacked area
- scatter chart
- bubble chart
- heatmap
- metric/KPI card
- pivot table
- Top N controls
- sort and filter controls
- series split
- drilldown
- cross-filtering
- export chart/table data

## Testing

Tests should cover:

- contract type examples for the expanded chart and table config shapes
- backend chart query acceptance for `pie`, `radar`, and `radial`
- chart renderer output for the new Recharts chart types
- config panel chart type options
- table widget config draft behavior
- table renderer pagination behavior
- dashboard canvas routing chart and table widgets to the correct renderer

