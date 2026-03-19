export type ChartPayload = {
  chartType: string;
  labels: string[];
  series: Array<{ name: string; data: number[] }>;
};
