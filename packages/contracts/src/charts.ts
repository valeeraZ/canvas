export type SupportedChartQueryType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "radar"
  | "radial";

export type ChartQueryRequest = {
  datasetId: string;
  chartType: SupportedChartQueryType;
  xField: string;
  yField: string;
};

export type ChartPayload = {
  chartType: SupportedChartQueryType;
  labels: string[];
  series: Array<{ name: string; data: number[] }>;
};
