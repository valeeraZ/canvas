export function buildSql(input: {
  tableName: string;
  dimensions: string[];
  measures: Array<{ field: string; op: string }>;
}) {
  const dimensions = input.dimensions.join(", ");
  const firstMeasure = input.measures[0];
  const measureExpr = `${firstMeasure.op}(${firstMeasure.field})`;

  return `select ${dimensions}, ${measureExpr} from ${input.tableName} group by ${dimensions}`;
}
