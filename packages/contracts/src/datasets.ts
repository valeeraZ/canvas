export type DatasetStatus =
  | "queued"
  | "profiling"
  | "processing"
  | "ready"
  | "warning"
  | "failed";

export type DatasetRecord = {
  id: string;
  tenantId: string;
  name: string;
  status: DatasetStatus;
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
  importStatus?: DatasetStatus;
};

export type ImportJobRecord = {
  id: string;
  datasetId: string;
  tenantId: string;
  status: DatasetStatus;
  objectKey: string;
  warnings: Array<{ code: string; message?: string }>;
};
