import { describe, expect, it, vi } from "vitest";
import { createDatasetsService } from "./app";

describe("createDatasetsService", () => {
  it("uses the import job id as the upload session id", async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dataset: {
        create: vi.fn().mockResolvedValue({
          id: "ds_1",
          tenantId: "tenant_row_1",
          name: "Sales Upload",
          status: "queued",
          warnings: [],
          preview: null,
          tenant: {
            slug: "canvas"
          }
        })
      },
      importJob: {
        create: vi.fn().mockResolvedValue({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          status: "queued",
          objectKey: "canvas/uploads/sales.csv",
          warnings: []
        })
      }
    } as never;

    const service = createDatasetsService({
      db: prisma,
      tenantId: "canvas"
    });

    const session = await service.createUpload({
      tenantId: "canvas",
      filename: "sales.csv",
      name: "Sales Upload",
      contentType: "text/csv",
      sizeBytes: 256,
      uploadedByExternalUserId: "dev-1",
      uploadedByDisplayName: "Local Dev"
    });

    expect(session.uploadId).toBe("job_123");
    expect(session.upload.uploadUrl).toBe("/datasets/uploads/job_123/file");
    expect(session.dataset.sourceFilename).toBe("sales.csv");
    expect(session.dataset.uploadedByDisplayName).toBe("Local Dev");
  });

  it("streams the uploaded file to multipart storage and persists dataset metadata", async () => {
    async function* makeBody() {
      yield "Month,Revenue\nJan,120";
    }

    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dataset: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({
            id: "ds_1",
            preview: null
          })
          .mockResolvedValueOnce({
            id: "ds_1",
            tenantId: "tenant_row_1",
            name: "Sales Upload",
            status: "queued",
            warnings: [],
            preview: null,
            uploadedByExternalUserId: "dev-1",
            uploadedByDisplayName: "Local Dev",
            tenant: {
              slug: "canvas"
            }
          }),
        update: vi.fn().mockResolvedValue({
          id: "ds_1",
          tenantId: "tenant_row_1",
          name: "Sales Upload",
          status: "queued",
          warnings: [],
          preview: null,
          uploadedByExternalUserId: "dev-1",
          uploadedByDisplayName: "Local Dev",
          contentType: "text/csv",
          sizeBytes: 21,
          storageBucket: "canvas-raw",
          storageObjectKey: "canvas/uploads/sales.csv",
          storageUploadId: "s3-upload-1",
          importStatus: "queued",
          tenant: {
            slug: "canvas"
          }
        })
      },
      importJob: {
        findFirst: vi.fn().mockResolvedValue({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          status: "queued",
          objectKey: "canvas/uploads/sales.csv",
          warnings: []
        })
      }
    } as never;

    const importQueue = {
      enqueue: vi.fn(async () => undefined)
    };
    const multipartUploads = {
      create: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        uploadId: "s3-upload-1"
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

    const service = createDatasetsService({
      db: prisma,
      tenantId: "canvas",
      multipartUploads,
      importQueue,
      storageBucket: "canvas-raw",
      uploadPartSizeBytes: 5
    });

    const result = await service.uploadFile({
      uploadId: "job_123",
      tenantId: "canvas",
      contentType: "text/csv",
      body: makeBody()
    });

    expect(prisma.dataset.update).toHaveBeenCalledWith({
      where: {
        id: "ds_1"
      },
      data: {
        contentType: "text/csv",
        sizeBytes: 21,
        storageBucket: "canvas-raw",
        storageObjectKey: "canvas/uploads/sales.csv",
        storageUploadId: "s3-upload-1",
        importStatus: "queued"
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(importQueue.enqueue).toHaveBeenCalledWith("job_123");
    expect(result).toEqual({
      uploadId: "job_123",
      datasetId: "ds_1",
      bucket: "canvas-raw",
      objectKey: "canvas/uploads/sales.csv",
      sizeBytes: 21,
      importStatus: "queued"
    });
  });

  it("does not enqueue the import job when file streaming fails", async () => {
    async function* makeBody() {
      yield "Month,Revenue\nJan,120";
    }

    const prisma = {
      importJob: {
        findFirst: vi.fn().mockResolvedValue({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          status: "queued",
          objectKey: "canvas/uploads/sales.csv",
          warnings: []
        })
      }
    } as never;

    const importQueue = {
      enqueue: vi.fn(async () => undefined)
    };
    const multipartUploads = {
      create: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        uploadId: "s3-upload-1"
      })),
      uploadPart: vi.fn(async () => {
        throw new Error("stream failed");
      }),
      complete: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv"
      })),
      abort: vi.fn(async () => undefined)
    };

    const service = createDatasetsService({
      db: prisma,
      tenantId: "canvas",
      multipartUploads,
      importQueue,
      storageBucket: "canvas-raw",
      uploadPartSizeBytes: 5
    });

    await expect(
      service.uploadFile({
        uploadId: "job_123",
        tenantId: "canvas",
        contentType: "text/csv",
        body: makeBody()
      })
    ).rejects.toThrow("stream failed");

    expect(importQueue.enqueue).not.toHaveBeenCalled();
  });
});
