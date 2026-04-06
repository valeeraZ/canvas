import { describe, expect, it, vi } from "vitest";
import {
  createMultipartUploadService,
  type MultipartUploadDriver
} from "./multipart-upload";

describe("createMultipartUploadService", () => {
  it("delegates create, uploadPart, complete, and abort to the driver", async () => {
    const driver: MultipartUploadDriver = {
      createMultipartUpload: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        uploadId: "upload_123"
      })),
      uploadPart: vi.fn(async () => ({
        etag: "etag-1",
        partNumber: 1
      })),
      completeMultipartUpload: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv"
      })),
      abortMultipartUpload: vi.fn(async () => undefined)
    };

    const service = createMultipartUploadService(driver);

    const upload = await service.create({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      contentType: "text/csv"
    });
    const part = await service.uploadPart({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId,
      partNumber: 1,
      body: Buffer.from("month,revenue")
    });
    const completed = await service.complete({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId,
      parts: [part]
    });
    await service.abort({
      bucket: upload.bucket,
      key: upload.key,
      uploadId: upload.uploadId
    });

    expect(upload.uploadId).toBe("upload_123");
    expect(part.etag).toBe("etag-1");
    expect(completed.key).toBe("canvas/uploads/sales.csv");
    expect(driver.createMultipartUpload).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      contentType: "text/csv"
    });
    expect(driver.uploadPart).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      uploadId: "upload_123",
      partNumber: 1,
      body: Buffer.from("month,revenue")
    });
    expect(driver.completeMultipartUpload).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      uploadId: "upload_123",
      parts: [{ etag: "etag-1", partNumber: 1 }]
    });
    expect(driver.abortMultipartUpload).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      uploadId: "upload_123"
    });
  });
});
