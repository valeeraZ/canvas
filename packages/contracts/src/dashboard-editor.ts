export type SupportedChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "radar"
  | "radial"
  | "table";

export type SupportedVisualChartType = Exclude<SupportedChartType, "table">;

export type DatasetPreviewColumn = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "unknown";
};

export type NormalizedDatasetRecord = Record<
  string,
  string | number | boolean | null
>;

export type DatasetPreview = {
  datasetId: string;
  columns: DatasetPreviewColumn[];
  sampleRows: NormalizedDatasetRecord[];
};

export type ChartWidgetConfig = {
  datasetId: string;
  chartType: SupportedVisualChartType;
  xField: string;
  yField: string;
  seriesField?: string;
  title?: string;
};

export type TableWidgetConfig = {
  datasetId: string;
  chartType: "table";
  columns: string[];
  pageSize: number;
  title?: string;
};

export type TableRowsPayload = {
  columns: string[];
  rows: NormalizedDatasetRecord[];
  page: number;
  pageSize: number;
  totalRows: number;
};
