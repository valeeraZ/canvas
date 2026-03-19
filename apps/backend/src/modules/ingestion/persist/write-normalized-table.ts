export async function writeNormalizedTable(input: {
  tenantId: string;
  datasetId: string;
  headers: string[];
  rows: Array<Array<string | null>>;
}) {
  return {
    tableName: `tenant_${input.tenantId}_dataset_${input.datasetId}`,
    rowCount: input.rows.length
  };
}
