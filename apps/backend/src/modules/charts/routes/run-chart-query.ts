import { runQuery } from "../../query/routes/run-query";

export async function runChartQuery(input: {
  chartType: string;
  datasetId: string;
}) {
  await runQuery({
    tableName: input.datasetId,
    dimensions: [],
    measures: [{ field: "value", op: "sum" }]
  });

  return {
    chartType: input.chartType,
    series: []
  };
}
