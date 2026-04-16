export async function writeNormalizedTable(input: {
  datasetRows: {
    replaceRows(input: {
      tenantId: string;
      datasetId: string;
      rows: Array<Record<string, string | number | boolean | null>>;
    }): Promise<unknown>;
  };
  tenantId: string;
  datasetId: string;
  headers: string[];
  rows: Array<Array<string | null>>;
}) {
  await input.datasetRows.replaceRows({
    tenantId: input.tenantId,
    datasetId: input.datasetId,
    rows: input.rows.map((row) =>
      input.headers.reduce<Record<string, string | number | boolean | null>>(
        (record, header, index) => {
          record[header] = row[index] ?? null;
          return record;
        },
        {}
      )
    )
  });

  return {
    rowCount: input.rows.length
  };
}
