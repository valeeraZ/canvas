import { describe, expect, it, vi } from "vitest";
import { createImportJobStore } from "./import-job-store";

describe("createImportJobStore", () => {
  it("finds an upload session by id within the active app", async () => {
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

    const store = createImportJobStore(prisma);
    const job = await store.findById({
      tenantId: "canvas",
      importJobId: "job_123"
    });

    expect(prisma.importJob.findFirst).toHaveBeenCalledWith({
      where: {
        id: "job_123",
        tenantId: "canvas"
      }
    });
    expect(job?.id).toBe("job_123");
  });

  it("updates the import job status after upload progress", async () => {
    const prisma = {
      importJob: {
        update: vi.fn().mockResolvedValue({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          status: "processing",
          objectKey: "canvas/uploads/sales.csv",
          warnings: []
        })
      }
    } as never;

    const store = createImportJobStore(prisma);
    const job = await store.updateStatus({
      importJobId: "job_123",
      status: "processing"
    });

    expect(prisma.importJob.update).toHaveBeenCalledWith({
      where: {
        id: "job_123"
      },
      data: {
        status: "processing"
      }
    });
    expect(job.status).toBe("processing");
  });
});
