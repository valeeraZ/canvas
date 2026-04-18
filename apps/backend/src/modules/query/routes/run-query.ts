import { buildSql } from "../lib/build-sql";

function assertAllowedField(
  field: string,
  allowedFields: string[],
  datasetId: string
) {
  if (!allowedFields.includes(field)) {
    throw new Error(`Query field "${field}" is not available on dataset ${datasetId}`);
  }
}

export async function runQuery(input: {
  db: {
    $queryRawUnsafe<T extends Array<Record<string, string | number>>>(
      query: string,
      ...values: string[]
    ): Promise<T>;
  };
  tenantId: string;
  datasetId: string;
  allowedFields: string[];
  dimensions: string[];
  measures: Array<{ field: string; op: string }>;
}) {
  for (const dimension of input.dimensions) {
    assertAllowedField(dimension, input.allowedFields, input.datasetId);
  }

  for (const measure of input.measures) {
    if (measure.op !== "count") {
      assertAllowedField(measure.field, input.allowedFields, input.datasetId);
    }
  }

  const query = buildSql(input);
  const rows = await input.db.$queryRawUnsafe<Array<Record<string, string | number>>>(
    query.text,
    ...query.values
  );

  return {
    sql: query.text,
    values: query.values,
    rows
  };
}
