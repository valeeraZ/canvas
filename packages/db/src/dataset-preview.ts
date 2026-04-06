import type {
  DatasetPreview,
  DatasetPreviewColumn,
  NormalizedDatasetRecord
} from "@canvas/contracts";

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replaceAll(" ", "_");
}

function parseCell(value: string | null): string | number | boolean | null {
  if (value === null || value === "") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  const numericValue = Number(trimmed);

  if (!Number.isNaN(numericValue) && trimmed !== "") {
    return numericValue;
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

  return "string";
}

export function buildDatasetPreview(input: {
  datasetId: string;
  headers: string[];
  rows: string[][];
}): DatasetPreview {
  const normalizedHeaders = input.headers.map(normalizeHeader);
  const records: NormalizedDatasetRecord[] = input.rows.map((row) => {
    return normalizedHeaders.reduce<NormalizedDatasetRecord>((record, header, index) => {
      record[header] = parseCell(row[index] ?? null);
      return record;
    }, {});
  });

  const columns = normalizedHeaders.map<DatasetPreviewColumn>((header) => ({
    name: header,
    type: inferColumnType(records.map((record) => record[header] ?? null))
  }));

  return {
    datasetId: input.datasetId,
    columns,
    sampleRows: records.slice(0, 5),
    records
  };
}
