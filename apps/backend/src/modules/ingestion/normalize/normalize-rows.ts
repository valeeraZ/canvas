type NormalizedCellValue = string | number | boolean | null;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replaceAll(" ", "_");
}

function normalizeCell(value: string): NormalizedCellValue {
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

  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return trimmed;
}

export function normalizeRows(input: { headers: string[]; rows: string[][] }) {
  return {
    headers: input.headers.map(normalizeHeader),
    rows: input.rows.map((row) => row.map(normalizeCell))
  };
}
