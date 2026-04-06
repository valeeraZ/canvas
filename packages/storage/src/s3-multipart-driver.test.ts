import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand
} from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";
import { createS3MultipartUploadDriver } from "./s3-multipart-driver";

describe("createS3MultipartUploadDriver", () => {
  it("maps multipart operations to S3 commands", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        UploadId: "upload_123"
      })
      .mockResolvedValueOnce({
        ETag: "etag-1"
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const driver = createS3MultipartUploadDriver({
      send
    });

    const upload = await driver.createMultipartUpload({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      contentType: "text/csv"
    });
    const part = await driver.uploadPart({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId,
      partNumber: 1,
      body: Buffer.from("month,revenue")
    });
    await driver.completeMultipartUpload({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId,
      parts: [part]
    });
    await driver.abortMultipartUpload({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId
    });

    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(CreateMultipartUploadCommand);
    expect(send.mock.calls[0]?.[0].input).toEqual({
      Bucket: "canvas-raw",
      Key: "canvas/uploads/sales.csv",
      ContentType: "text/csv"
    });
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(UploadPartCommand);
    expect(send.mock.calls[1]?.[0].input).toMatchObject({
      Bucket: "canvas-raw",
      Key: "canvas/uploads/sales.csv",
      UploadId: "upload_123",
      PartNumber: 1
    });
    expect(send.mock.calls[2]?.[0]).toBeInstanceOf(CompleteMultipartUploadCommand);
    expect(send.mock.calls[2]?.[0].input).toEqual({
      Bucket: "canvas-raw",
      Key: "canvas/uploads/sales.csv",
      UploadId: "upload_123",
      MultipartUpload: {
        Parts: [{ ETag: "etag-1", PartNumber: 1 }]
      }
    });
    expect(send.mock.calls[3]?.[0]).toBeInstanceOf(AbortMultipartUploadCommand);
    expect(send.mock.calls[3]?.[0].input).toEqual({
      Bucket: "canvas-raw",
      Key: "canvas/uploads/sales.csv",
      UploadId: "upload_123"
    });
  });
});
