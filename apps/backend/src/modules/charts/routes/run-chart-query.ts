import { runQuery } from "../../query/routes/run-query";

export async function runChartQuery(input: {
  chartType: string;
  tenantId: string;
  datasetId: string;
  xField: string;
  yField: string;
  allowedFields: string[];
  db?: Parameters<typeof runQuery>[0]["db"];
  runQueryImpl?: (input: Omit<Parameters<typeof runQuery>[0], "db">) => Promise<unknown>;
}) {
  const runQueryImpl =
    input.runQueryImpl ??
    ((queryInput: Omit<Parameters<typeof runQuery>[0], "db">) => {
      if (!input.db) {
        throw new Error("runChartQuery requires db when runQueryImpl is not provided");
      }

      return runQuery({
        db: input.db,
        ...queryInput
      });
    });

  await runQueryImpl({
    tenantId: input.tenantId,
    datasetId: input.datasetId,
    allowedFields: input.allowedFields,
    dimensions: [input.xField],
    measures: [{ field: input.yField, op: "sum" }]
  });

  return {
    chartType: input.chartType,
    series: []
  };
}
