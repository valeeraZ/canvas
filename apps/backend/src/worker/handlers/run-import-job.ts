import { buildImportJobPayload } from "../../../../../packages/queue/src/import-jobs.js";

export async function runImportJob(input: {
  tenantId: string;
  datasetId: string;
  objectKey: string;
}) {
  return buildImportJobPayload(input);
}
