export function mapDatasetSummary(input: {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  warnings: Array<{ code: string }>;
  uploadedByExternalUserId?: string;
  uploadedByDisplayName?: string;
}) {
  return {
    id: input.id,
    tenantId: input.tenantId,
    name: input.name,
    status: input.status,
    warningCount: input.warnings.length,
    uploadedByExternalUserId: input.uploadedByExternalUserId,
    uploadedByDisplayName: input.uploadedByDisplayName
  };
}
