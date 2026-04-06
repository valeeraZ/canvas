export type StorageClientConfig = {
  endpoint: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  forcePathStyle?: boolean;
};

export type StorageClient = {
  bucket: string;
  putObject: (key: string, body: Buffer | string) => Promise<{ key: string; size: number }>;
  getObject: (key: string) => Promise<{ key: string }>;
};

export type MultipartUploadCreateInput = {
  bucket: string;
  key: string;
  contentType?: string;
};

export type MultipartUploadState = {
  bucket: string;
  key: string;
  uploadId: string;
};

export type MultipartUploadPart = {
  etag: string;
  partNumber: number;
};

export type MultipartUploadDriver = {
  createMultipartUpload: (
    input: MultipartUploadCreateInput
  ) => Promise<MultipartUploadState>;
  uploadPart: (input: MultipartUploadState & {
    partNumber: number;
    body: Buffer;
  }) => Promise<MultipartUploadPart>;
  completeMultipartUpload: (input: MultipartUploadState & {
    parts: MultipartUploadPart[];
  }) => Promise<{
    bucket: string;
    key: string;
  }>;
  abortMultipartUpload: (input: MultipartUploadState) => Promise<void>;
};
