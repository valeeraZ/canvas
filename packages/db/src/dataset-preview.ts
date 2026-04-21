import type {
  DatasetPreview,
  DatasetPreviewColumn,
  NormalizedDatasetRecord
} from "@canvas/contracts";

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replaceAll(" ", "_");
}

function isDateLikeString(value: string) {
  return /^\d{4}-\d{2}-\d{2}(?:[tT ][\d:.+-Z]*)?$/.test(value);
}

function normalizeCellValue(
  value: string | number | boolean | null
): string | number | boolean | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  return trimmed;
}

function inferColumnType(values: Array<string | number | boolean | null>): DatasetPreviewColumn["type"] {
  const nonNullValues = values.filter((value) => value !== null);

  if (nonNullValues.length === 0) {
    return "unknown";
  }

  if (nonNullValues.every((value) => typeof value === "boolean")) {
    return "boolean";
  }

  if (nonNullValues.every((value) => typeof value === "number")) {
    return "number";
  }

  if (
    nonNullValues.every(
      (value) => typeof value === "string" && isDateLikeString(value)
    )
  ) {
    return "date";
  }

  return "string";
}

export function buildDatasetPreview(input: {
  datasetId: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
}): DatasetPreview {
  const normalizedHeaders = input.headers.map(normalizeHeader);
  const sampleRows: NormalizedDatasetRecord[] = input.rows.map((row) => {
    return normalizedHeaders.reduce<NormalizedDatasetRecord>((record, header, index) => {
      record[header] = normalizeCellValue(row[index] ?? null);
      return record;
    }, {});
  });

  const columns = normalizedHeaders.map<DatasetPreviewColumn>((header) => ({
    name: header,
    type: inferColumnType(sampleRows.map((record) => record[header] ?? null))
  }));

  return {
    datasetId: input.datasetId,
    columns,
    sampleRows: sampleRows.slice(0, 5)
  };
}
