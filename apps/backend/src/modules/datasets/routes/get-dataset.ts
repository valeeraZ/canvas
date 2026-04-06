export function mapDatasetDetail(input: {
  id: string;
  name: string;
  status: string;
  warnings: Array<{ code: string; message?: string }>;
  uploadedByExternalUserId?: string;
  uploadedByDisplayName?: string;
  uploadedAt?: string;
  sourceFilename?: string;
  contentType?: string;
  sizeBytes?: number;
  storageBucket?: string;
  storageObjectKey?: string;
  storageUploadId?: string;
  importStatus?: string;
  usageSummary?: {
    dashboards: Array<{ id: string; name: string }>;
    widgets: Array<{
      id: string;
      dashboardId: string;
      dashboardName: string;
      type: string;
    }>;
    workbooks: Array<{ id: string; name: string }>;
  };
}) {
  return {
    id: input.id,
    name: input.name,
    status: input.status,
    warnings: input.warnings,
    uploadedByExternalUserId: input.uploadedByExternalUserId,
    uploadedByDisplayName: input.uploadedByDisplayName,
    uploadedAt: input.uploadedAt,
    sourceFilename: input.sourceFilename,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    storageBucket: input.storageBucket,
    storageObjectKey: input.storageObjectKey,
    storageUploadId: input.storageUploadId,
    importStatus: input.importStatus,
    usageSummary: input.usageSummary ?? {
      dashboards: [],
      widgets: [],
      workbooks: []
    }
  };
}
