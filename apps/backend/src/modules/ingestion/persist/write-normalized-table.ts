function normalizeIdentifier(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
  const withFallback = normalized.length > 0 ? normalized : fallback;

  return /^[a-z_]/.test(withFallback)
    ? withFallback
    : `_${withFallback}`;
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildColumnNames(headers: string[]) {
  const usedNames = new Set<string>();

  return headers.map((header, index) => {
    const baseName = normalizeIdentifier(header, `column_${index + 1}`);
    let columnName = baseName;
    let suffix = 2;

    while (usedNames.has(columnName)) {
      columnName = `${baseName}_${suffix}`;
      suffix += 1;
    }

    usedNames.add(columnName);
    return columnName;
  });
}

export async function writeNormalizedTable(input: {
  db: {
    $executeRawUnsafe(
      query: string,
      ...values: Array<string | null>
    ): Promise<unknown>;
  };
  tenantId: string;
  datasetId: string;
  headers: string[];
  rows: Array<Array<string | null>>;
}) {
  const tableName = `tenant_${normalizeIdentifier(
    input.tenantId,
    "tenant"
  )}_dataset_${normalizeIdentifier(input.datasetId, "dataset")}`;
  const columnNames = buildColumnNames(input.headers);
  const quotedTableName = quoteIdentifier(tableName);
  const quotedColumns = columnNames.map(quoteIdentifier);

  await input.db.$executeRawUnsafe(
    `DROP TABLE IF EXISTS ${quotedTableName}`
  );
  await input.db.$executeRawUnsafe(
    `CREATE TABLE ${quotedTableName} (${quotedColumns
      .map((columnName) => `${columnName} TEXT`)
      .join(", ")})`
  );

  if (input.rows.length > 0) {
    const values: Array<string | null> = [];
    const valuePlaceholders = input.rows
      .map((row) => {
        const rowPlaceholders = columnNames.map((_, columnIndex) => {
          values.push(row[columnIndex] ?? null);
          return `$${values.length}`;
        });

        return `(${rowPlaceholders.join(", ")})`;
      })
      .join(", ");

    await input.db.$executeRawUnsafe(
      `INSERT INTO ${quotedTableName} (${quotedColumns.join(
        ", "
      )}) VALUES ${valuePlaceholders}`,
      ...values
    );
  }

  return {
    tableName,
    rowCount: input.rows.length
  };
}
