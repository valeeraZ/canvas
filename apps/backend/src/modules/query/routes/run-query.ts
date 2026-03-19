import { buildSql } from "../lib/build-sql";

export async function runQuery(input: {
  tableName: string;
  dimensions: string[];
  measures: Array<{ field: string; op: string }>;
}) {
  return {
    sql: buildSql(input),
    rows: [] as Array<Record<string, string | number>>
  };
}
