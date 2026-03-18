import type { StorageClient, StorageClientConfig } from "./types";

export function createStorageClient(config: StorageClientConfig): StorageClient {
  return {
    bucket: config.bucket,
    async putObject(key: string, body: Buffer | string) {
      return { key, size: Buffer.byteLength(body) };
    },
    async getObject(key: string) {
      return { key };
    }
  };
}
