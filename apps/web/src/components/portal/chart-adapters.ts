import type { ChartPayload } from "../../../../../packages/contracts/src/charts.js";
import type { ChartConfig } from "../ui/chart";

const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)"
] as const;

export function buildChartRenderModel(input: ChartPayload) {
  const seriesKeys = input.series.map((series) => series.name);
  const data = input.labels.map((label, index) =>
    Object.assign(
      { label },
      ...input.series.map((series) => ({
        [series.name]: Number(series.data[index] ?? 0)
      }))
    )
  );
  const config = Object.fromEntries(
    input.series.map((series, index) => [
      series.name,
      {
        label: series.name,
        color: SERIES_COLORS[index % SERIES_COLORS.length]
      }
    ])
  ) as ChartConfig;

  return {
    config,
    data,
    labelKey: "label",
    seriesKeys
  };
}
