type ChartAdapterInput = {
  chartType: "bar" | "line" | "area" | "pie";
  xField: string;
  yField: string;
  seriesField?: string;
  records: Array<Record<string, string | number | boolean | null>>;
};

export function buildChartRenderModel(input: ChartAdapterInput) {
  if (input.chartType === "pie") {
    return {
      data: input.records.map((record) => ({
        name: String(record[input.xField] ?? ""),
        value: Number(record[input.yField] ?? 0)
      })),
      seriesKeys: []
    };
  }

  if (!input.seriesField) {
    return {
      data: input.records.map((record) => ({
        [input.xField]: record[input.xField],
        [input.yField]: Number(record[input.yField] ?? 0)
      })),
      seriesKeys: [input.yField]
    };
  }

  const grouped = new Map<string, Record<string, string | number | null>>();

  for (const record of input.records) {
    const xValue = String(record[input.xField] ?? "");
    const seriesValue = String(record[input.seriesField] ?? "");
    const yValue = Number(record[input.yField] ?? 0);
    const existing = grouped.get(xValue) ?? { [input.xField]: xValue };

    existing[seriesValue] = yValue;
    grouped.set(xValue, existing);
  }

  const seriesKeys = Array.from(
    new Set(
      input.records.map((record) => String(record[input.seriesField as string] ?? ""))
    )
  ).filter(Boolean);

  return {
    data: Array.from(grouped.values()),
    seriesKeys
  };
}
