import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";
import { createMultipartUploadService } from "./multipart-upload";
import type { MultipartUploadDriver, MultipartUploadState, StorageClientConfig } from "./types";

type S3CommandClient = Pick<S3Client, "send">;

export function createS3MultipartUploadDriver(client: S3CommandClient): MultipartUploadDriver {
  return {
    async createMultipartUpload(input) {
      const response = await client.send(
        new CreateMultipartUploadCommand({
          Bucket: input.bucket,
          Key: input.key,
          ContentType: input.contentType
        })
      );

      return {
        bucket: input.bucket,
        key: input.key,
        uploadId: response.UploadId ?? ""
      };
    },
    async uploadPart(input) {
      const response = await client.send(
        new UploadPartCommand({
          Bucket: input.bucket,
          Key: input.key,
          UploadId: input.uploadId,
          PartNumber: input.partNumber,
          Body: input.body
        })
      );

      return {
        etag: response.ETag ?? "",
        partNumber: input.partNumber
      };
    },
    async completeMultipartUpload(input) {
      await client.send(
        new CompleteMultipartUploadCommand({
          Bucket: input.bucket,
          Key: input.key,
          UploadId: input.uploadId,
          MultipartUpload: {
            Parts: input.parts.map((part) => ({
              ETag: part.etag,
              PartNumber: part.partNumber
            }))
          }
        })
      );

      return {
        bucket: input.bucket,
        key: input.key
      };
    },
    async abortMultipartUpload(input: MultipartUploadState) {
      await client.send(
        new AbortMultipartUploadCommand({
          Bucket: input.bucket,
          Key: input.key,
          UploadId: input.uploadId
        })
      );
    }
  };
}

export function createS3MultipartUploadService(config: StorageClientConfig) {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
          }
        : undefined,
    forcePathStyle: config.forcePathStyle
  });

  return createMultipartUploadService(createS3MultipartUploadDriver(client));
}
