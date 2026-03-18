export type StorageClientConfig = {
  endpoint: string;
  bucket: string;
};

export type StorageClient = {
  bucket: string;
  putObject: (key: string, body: Buffer | string) => Promise<{ key: string; size: number }>;
  getObject: (key: string) => Promise<{ key: string }>;
};
