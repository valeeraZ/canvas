export function mapChartPayload(input: {
  chartType: string;
  rows: Array<Record<string, string | number>>;
  labelField: string;
  valueField: string;
}) {
  return {
    chartType: input.chartType,
    labels: input.rows.map((row) => String(row[input.labelField] ?? "")),
    series: [
      {
        name: input.valueField,
        data: input.rows.map((row) => Number(row[input.valueField] ?? 0))
      }
    ]
  };
}
