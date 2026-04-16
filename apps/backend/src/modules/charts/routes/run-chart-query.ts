import type {
  ChartPayload,
  SupportedChartQueryType
} from "../../../../../../packages/contracts/src/charts.js";
import { mapChartPayload } from "../../query/lib/map-chart-payload";
import { runQuery } from "../../query/routes/run-query";

function assertSupportedChartType(
  chartType: string
): asserts chartType is SupportedChartQueryType {
  if (chartType !== "bar" && chartType !== "line" && chartType !== "area") {
    throw new Error(`Unsupported chart type: ${chartType}`);
  }
}

export async function runChartQuery(input: {
  chartType: string;
  tenantId: string;
  datasetId: string;
  xField: string;
  yField: string;
  allowedFields: string[];
  db?: Parameters<typeof runQuery>[0]["db"];
  runQueryImpl?: (
    input: Omit<Parameters<typeof runQuery>[0], "db">
  ) => Promise<Awaited<ReturnType<typeof runQuery>>>;
}): Promise<ChartPayload> {
  assertSupportedChartType(input.chartType);

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

  const result = await runQueryImpl({
    tenantId: input.tenantId,
    datasetId: input.datasetId,
    allowedFields: input.allowedFields,
    dimensions: [input.xField],
    measures: [{ field: input.yField, op: "sum" }]
  });

  return mapChartPayload({
    chartType: input.chartType,
    rows: result.rows,
    labelField: input.xField,
    valueField: input.yField
  });
}
