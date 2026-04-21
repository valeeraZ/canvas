export type SupportedChartType = "bar" | "line" | "area" | "pie";

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
  chartType: SupportedChartType;
  xField: string;
  yField: string;
  seriesField?: string;
  title?: string;
};
