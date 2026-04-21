import type {
  ChartPayload,
  SupportedChartQueryType
} from "../../../../../../packages/contracts/src/charts.js";
import { mapChartPayload } from "../../query/lib/map-chart-payload";
import { runQuery } from "../../query/routes/run-query";

type ParsedDatasetRow = Record<string, string | number | boolean | null>;

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
  rows?: ParsedDatasetRow[];
  db?: Parameters<typeof runQuery>[0]["db"];
  runQueryImpl?: (
    input: Omit<Parameters<typeof runQuery>[0], "db">
  ) => Promise<Awaited<ReturnType<typeof runQuery>>>;
}): Promise<ChartPayload> {
  assertSupportedChartType(input.chartType);

  for (const field of [input.xField, input.yField]) {
    if (!input.allowedFields.includes(field)) {
      throw new Error(`Query field "${field}" is not available on dataset ${input.datasetId}`);
    }
  }

  if (input.rows) {
    const grouped = new Map<string, number>();

    for (const row of input.rows) {
      const label = String(row[input.xField] ?? "");
      const value = Number(row[input.yField] ?? 0);
      grouped.set(label, (grouped.get(label) ?? 0) + (Number.isNaN(value) ? 0 : value));
    }

    return mapChartPayload({
      chartType: input.chartType,
      rows: [...grouped].map(([label, value]) => ({
        [input.xField]: label,
        [`sum_${input.yField}`]: value
      })),
      labelField: input.xField,
      valueField: `sum_${input.yField}`,
      seriesName: input.yField
    });
  }

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
    valueField: `sum_${input.yField}`,
    seriesName: input.yField
  });
}
