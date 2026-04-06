import type { StorageClientConfig } from "./types";

type StorageEnv = Record<string, string | undefined>;

export function readStorageConfig(env: StorageEnv): StorageClientConfig {
  return {
    endpoint: env.S3_ENDPOINT ?? "",
    region: env.S3_REGION ?? "",
    accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
    bucket: env.S3_BUCKET ?? "",
    forcePathStyle: env.S3_FORCE_PATH_STYLE === "true"
  };
}
