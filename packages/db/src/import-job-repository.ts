export function buildImportJobRecord(input: {
  tenantId: string;
  datasetId: string;
  objectKey: string;
}) {
  return {
    tenantId: input.tenantId,
    datasetId: input.datasetId,
    objectKey: input.objectKey,
    status: "queued" as const
  };
}
