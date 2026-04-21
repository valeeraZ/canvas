import { buildDatasetPreview } from "../../../../../../packages/db/src/index.js";
import { parseCsv } from "../../ingestion/parsers/csv";
import { normalizeRows } from "../../ingestion/normalize/normalize-rows";

export function buildUploadPreview(input: {
  datasetId: string;
  filename: string;
  content?: string;
}) {
  if (!input.content || !input.filename.toLowerCase().endsWith(".csv")) {
    return null;
  }

  const parsed = parseCsv(input.content);
  const normalized = normalizeRows(parsed);

  return buildDatasetPreview({
    datasetId: input.datasetId,
    headers: normalized.headers,
    rows: normalized.rows
  });
}
