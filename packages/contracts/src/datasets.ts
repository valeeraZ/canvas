export type DatasetStatus = "queued" | "processing" | "ready" | "warning" | "failed";

export type DatasetRecord = {
  id: string;
  tenantId: string;
  name: string;
  status: DatasetStatus;
  warnings: Array<{ code: string; message?: string }>;
};

export type ImportJobRecord = {
  id: string;
  datasetId: string;
  tenantId: string;
  status: DatasetStatus;
  objectKey: string;
  warnings: Array<{ code: string; message?: string }>;
};
