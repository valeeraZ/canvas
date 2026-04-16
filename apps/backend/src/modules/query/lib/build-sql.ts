export function buildSql(input: {
  tenantId: string;
  datasetId: string;
  dimensions: string[];
  measures: Array<{ field: string; op: string }>;
}) {
  const firstMeasure = input.measures[0];
  const dimension = input.dimensions[0];
  const dimensionExpr = dimension
    ? `record->>'${dimension}'`
    : null;
  const measureExpr =
    firstMeasure.op === "count"
      ? `count(*)`
      : `${firstMeasure.op}((record->>'${firstMeasure.field}')::numeric)`;
  const measureAlias = `${firstMeasure.op}_${firstMeasure.field}`;

  return {
    text: dimensionExpr
      ? `select ${dimensionExpr} as "${dimension}", ${measureExpr} as "${measureAlias}" ` +
        `from "DatasetRow" where "tenantId" = $1 and "datasetId" = $2 ` +
        `group by ${dimensionExpr}`
      : `select ${measureExpr} as "${measureAlias}" ` +
        `from "DatasetRow" where "tenantId" = $1 and "datasetId" = $2`,
    values: [input.tenantId, input.datasetId]
  };
}
