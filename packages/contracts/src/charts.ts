export type SupportedChartQueryType = "bar" | "line" | "area";

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
