import { describe, expect, it, vi } from "vitest";
import { streamMultipartUpload } from "./upload-file";

async function* makeChunks(chunks: Array<string | Buffer>) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

describe("streamMultipartUpload", () => {
  it("splits an incoming stream into multipart upload parts and completes the upload", async () => {
    const multipartUploads = {
      create: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        uploadId: "upload_123"
      })),
      uploadPart: vi.fn(async (input: { partNumber: number }) => ({
        etag: `etag-${input.partNumber}`,
        partNumber: input.partNumber
      })),
      complete: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv"
      })),
      abort: vi.fn(async () => undefined)
    };

    const result = await streamMultipartUpload({
      multipartUploads,
      bucket: "canvas-raw",
      objectKey: "canvas/uploads/sales.csv",
      contentType: "text/csv",
      partSizeBytes: 5,
      body: makeChunks(["Month", ",Revenue", "\nJan,120"])
    });

    expect(result.sizeBytes).toBe(21);
    expect(multipartUploads.create).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      contentType: "text/csv"
    });
    expect(multipartUploads.uploadPart).toHaveBeenCalledTimes(5);
    expect(multipartUploads.complete).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      uploadId: "upload_123",
      parts: [
        { etag: "etag-1", partNumber: 1 },
        { etag: "etag-2", partNumber: 2 },
        { etag: "etag-3", partNumber: 3 },
        { etag: "etag-4", partNumber: 4 },
        { etag: "etag-5", partNumber: 5 }
      ]
    });
    expect(multipartUploads.abort).not.toHaveBeenCalled();
  });

  it("aborts the multipart upload when a part upload fails", async () => {
    const multipartUploads = {
      create: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        uploadId: "upload_123"
      })),
      uploadPart: vi
        .fn()
        .mockResolvedValueOnce({ etag: "etag-1", partNumber: 1 })
        .mockRejectedValueOnce(new Error("upload failed")),
      complete: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv"
      })),
      abort: vi.fn(async () => undefined)
    };

    await expect(
      streamMultipartUpload({
        multipartUploads,
        bucket: "canvas-raw",
        objectKey: "canvas/uploads/sales.csv",
        partSizeBytes: 5,
        body: makeChunks(["Month", ",Revenue", "\nJan,120"])
      })
    ).rejects.toThrow("upload failed");

    expect(multipartUploads.abort).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      uploadId: "upload_123"
    });
    expect(multipartUploads.complete).not.toHaveBeenCalled();
  });
});
