import { buildImportJobPayload } from "../../../../../packages/queue/src/import-jobs";

export async function runImportJob(input: {
  tenantId: string;
  datasetId: string;
  objectKey: string;
}) {
  return buildImportJobPayload(input);
}
