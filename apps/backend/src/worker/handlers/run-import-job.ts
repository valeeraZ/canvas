import { buildDatasetPreview } from "../../../../../packages/db/src/dataset-preview.js";
import { normalizeRows } from "../../modules/ingestion/normalize/normalize-rows.js";
import { parseCsv } from "../../modules/ingestion/parsers/csv.js";

type ImportWarning = {
  code: string;
  message?: string;
};

export async function runImportJob(input: {
  jobId: string;
  storageBucket: string;
  claimJob: (input: {
    jobId: string;
    claimedAt: Date;
  }) => Promise<{
    id: string;
    datasetId: string;
    tenantId: string;
    objectKey: string;
  } | null>;
  markDatasetProcessing: (input: {
    tenantId: string;
    datasetId: string;
  }) => Promise<unknown>;
  readObject: (input: {
    bucket: string;
    key: string;
  }) => Promise<{
    bucket: string;
    key: string;
    body: Buffer;
  }>;
  persistNormalizedTable: (input: {
    tenantId: string;
    datasetId: string;
    headers: string[];
    rows: Array<Array<string | null>>;
  }) => Promise<unknown>;
  markDatasetReady: (input: {
    tenantId: string;
    datasetId: string;
    preview: ReturnType<typeof buildDatasetPreview>;
  }) => Promise<unknown>;
  markJobReady: (input: {
    jobId: string;
    completedAt: Date;
  }) => Promise<unknown>;
  markDatasetFailed: (input: {
    tenantId: string;
    datasetId: string;
    warnings: ImportWarning[];
  }) => Promise<unknown>;
  markJobFailed: (input: {
    jobId: string;
    completedAt: Date;
    warnings: ImportWarning[];
  }) => Promise<unknown>;
  now?: () => Date;
}) {
  const now = input.now ?? (() => new Date());
  const claimedAt = now();
  const claimedJob = await input.claimJob({
    jobId: input.jobId,
    claimedAt
  });

  if (!claimedJob) {
    return null;
  }

  try {
    await input.markDatasetProcessing({
      tenantId: claimedJob.tenantId,
      datasetId: claimedJob.datasetId
    });

    const object = await input.readObject({
      bucket: input.storageBucket,
      key: claimedJob.objectKey
    });
    const content = object.body.toString("utf8");

    if (content.trim().length === 0) {
      throw new Error("CSV import payload is empty");
    }

    const parsed = parseCsv(content);
    const normalized = normalizeRows(parsed);
    const preview = buildDatasetPreview({
      datasetId: claimedJob.datasetId,
      headers: normalized.headers,
      rows: normalized.rows.map((row) =>
        row.map((value) => (value === null ? "" : String(value)))
      )
    });

    await input.persistNormalizedTable({
      tenantId: claimedJob.tenantId,
      datasetId: claimedJob.datasetId,
      headers: normalized.headers,
      rows: normalized.rows
    });

    await input.markDatasetReady({
      tenantId: claimedJob.tenantId,
      datasetId: claimedJob.datasetId,
      preview
    });
    await input.markJobReady({
      jobId: claimedJob.id,
      completedAt: now()
    });

    return {
      jobId: claimedJob.id,
      datasetId: claimedJob.datasetId,
      tenantId: claimedJob.tenantId,
      objectKey: claimedJob.objectKey,
      preview
    };
  } catch (error) {
    const warning = {
      code: "import_failed",
      message: error instanceof Error ? error.message : "Import failed"
    } satisfies ImportWarning;

    await input.markDatasetFailed({
      tenantId: claimedJob.tenantId,
      datasetId: claimedJob.datasetId,
      warnings: [warning]
    });
    await input.markJobFailed({
      jobId: claimedJob.id,
      completedAt: now(),
      warnings: [warning]
    });

    throw error;
  }
}
