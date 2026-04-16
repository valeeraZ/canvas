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

  it("claims a queued import job once and returns null when it is already claimed", async () => {
    const prisma = {
      importJob: {
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          status: "processing",
          objectKey: "canvas/uploads/sales.csv",
          warnings: [],
          claimedAt: new Date("2026-04-06T10:00:00.000Z")
        })
      }
    } as never;

    const store = createImportJobStore(prisma);
    const claimed = await store.claimNext({
      importJobId: "job_123",
      claimedAt: new Date("2026-04-06T10:00:00.000Z")
    });
    const duplicate = await store.claimNext({
      importJobId: "job_123",
      claimedAt: new Date("2026-04-06T10:05:00.000Z")
    });

    expect(prisma.importJob.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: "job_123",
        status: "queued"
      },
      data: {
        status: "processing",
        claimedAt: new Date("2026-04-06T10:00:00.000Z")
      }
    });
    expect(claimed?.status).toBe("processing");
    expect(duplicate).toBeNull();
  });

  it("marks a job ready and clears warnings", async () => {
    const prisma = {
      importJob: {
        update: vi.fn().mockResolvedValue({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          status: "ready",
          objectKey: "canvas/uploads/sales.csv",
          warnings: [],
          claimedAt: new Date("2026-04-06T10:00:00.000Z"),
          completedAt: new Date("2026-04-06T10:01:00.000Z")
        })
      }
    } as never;

    const store = createImportJobStore(prisma);
    const job = await store.markReady({
      importJobId: "job_123",
      completedAt: new Date("2026-04-06T10:01:00.000Z")
    });

    expect(prisma.importJob.update).toHaveBeenCalledWith({
      where: {
        id: "job_123"
      },
      data: {
        status: "ready",
        warnings: [],
        completedAt: new Date("2026-04-06T10:01:00.000Z")
      }
    });
    expect(job.status).toBe("ready");
  });

  it("marks a job failed with warnings", async () => {
    const prisma = {
      importJob: {
        update: vi.fn().mockResolvedValue({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          status: "failed",
          objectKey: "canvas/uploads/sales.csv",
          warnings: [
            {
              code: "import_failed",
              message: "Malformed CSV row"
            }
          ],
          claimedAt: new Date("2026-04-06T10:00:00.000Z"),
          completedAt: new Date("2026-04-06T10:01:00.000Z")
        })
      }
    } as never;

    const store = createImportJobStore(prisma);
    const job = await store.markFailed({
      importJobId: "job_123",
      completedAt: new Date("2026-04-06T10:01:00.000Z"),
      warnings: [
        {
          code: "import_failed",
          message: "Malformed CSV row"
        }
      ]
    });

    expect(prisma.importJob.update).toHaveBeenCalledWith({
      where: {
        id: "job_123"
      },
      data: {
        status: "failed",
        warnings: [
          {
            code: "import_failed",
            message: "Malformed CSV row"
          }
        ],
        completedAt: new Date("2026-04-06T10:01:00.000Z")
      }
    });
    expect(job.warnings[0]?.code).toBe("import_failed");
  });

  it("lists and resets stale processing jobs", async () => {
    const staleCutoff = new Date("2026-04-06T10:15:00.000Z");
    const prisma = {
      importJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "job_123",
            datasetId: "ds_1",
            tenantId: "canvas",
            status: "processing",
            objectKey: "canvas/uploads/sales.csv",
            warnings: [],
            claimedAt: new Date("2026-04-06T10:00:00.000Z")
          }
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      }
    } as never;

    const store = createImportJobStore(prisma);
    const jobs = await store.listStaleProcessingJobs({
      staleBefore: staleCutoff
    });
    const resetCount = await store.resetStaleProcessingJobs({
      staleBefore: staleCutoff
    });

    expect(prisma.importJob.findMany).toHaveBeenCalledWith({
      where: {
        status: "processing",
        claimedAt: {
          lt: staleCutoff
        }
      },
      orderBy: {
        claimedAt: "asc"
      }
    });
    expect(prisma.importJob.updateMany).toHaveBeenCalledWith({
      where: {
        status: "processing",
        claimedAt: {
          lt: staleCutoff
        }
      },
      data: {
        status: "queued",
        claimedAt: null
      }
    });
    expect(jobs).toHaveLength(1);
    expect(resetCount).toBe(1);
  });

  it("lists queued jobs in stable order for reconciliation", async () => {
    const prisma = {
      importJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "job_123",
            datasetId: "ds_1",
            tenantId: "canvas",
            status: "queued",
            objectKey: "canvas/uploads/a.csv",
            warnings: []
          },
          {
            id: "job_456",
            datasetId: "ds_2",
            tenantId: "canvas",
            status: "queued",
            objectKey: "canvas/uploads/b.csv",
            warnings: []
          }
        ])
      }
    } as never;

    const store = createImportJobStore(prisma);
    const jobs = await store.listQueuedJobs();

    expect(prisma.importJob.findMany).toHaveBeenCalledWith({
      where: {
        status: "queued"
      },
      orderBy: {
        id: "asc"
      }
    });
    expect(jobs.map((job) => job.id)).toEqual(["job_123", "job_456"]);
  });
});
