import { describe, expect, it, vi } from "vitest";
import { runImportJob } from "./run-import-job";

describe("runImportJob", () => {
  it("claims a queued job, imports CSV data, and marks dataset/job ready", async () => {
    const claimJob = vi.fn(async () => ({
      id: "job_123",
      datasetId: "ds_1",
      tenantId: "canvas",
      objectKey: "canvas/uploads/sales.csv"
    }));
    const markDatasetProcessing = vi.fn(async () => undefined);
    const readObject = vi.fn(async () => ({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv",
      body: Buffer.from("Month,Revenue\nJan,120")
    }));
    const persistNormalizedTable = vi.fn(async () => ({
      tableName: "tenant_canvas_dataset_ds_1",
      rowCount: 1
    }));
    const markDatasetReady = vi.fn(async () => undefined);
    const markJobReady = vi.fn(async () => undefined);

    await runImportJob({
      jobId: "job_123",
      storageBucket: "canvas-raw",
      claimJob,
      markDatasetProcessing,
      readObject,
      persistNormalizedTable,
      markDatasetReady,
      markJobReady,
      markDatasetFailed: vi.fn(async () => undefined),
      markJobFailed: vi.fn(async () => undefined),
      now: () => new Date("2026-04-06T10:00:00.000Z")
    });

    expect(claimJob).toHaveBeenCalledWith({
      jobId: "job_123",
      claimedAt: new Date("2026-04-06T10:00:00.000Z")
    });
    expect(markDatasetProcessing).toHaveBeenCalledWith({
      tenantId: "canvas",
      datasetId: "ds_1"
    });
    expect(readObject).toHaveBeenCalledWith({
      bucket: "canvas-raw",
      key: "canvas/uploads/sales.csv"
    });
    expect(persistNormalizedTable).toHaveBeenCalledWith({
      tenantId: "canvas",
      datasetId: "ds_1",
      headers: ["month", "revenue"],
      rows: [["Jan", "120"]]
    });
    expect(markDatasetReady).toHaveBeenCalledOnce();
    expect(markJobReady).toHaveBeenCalledWith({
      jobId: "job_123",
      completedAt: new Date("2026-04-06T10:00:00.000Z")
    });
  });

  it("marks the dataset and job failed when import parsing fails", async () => {
    const markDatasetFailed = vi.fn(async () => undefined);
    const markJobFailed = vi.fn(async () => undefined);

    await expect(
      runImportJob({
        jobId: "job_123",
        storageBucket: "canvas-raw",
        claimJob: vi.fn(async () => ({
          id: "job_123",
          datasetId: "ds_1",
          tenantId: "canvas",
          objectKey: "canvas/uploads/sales.csv"
        })),
        markDatasetProcessing: vi.fn(async () => undefined),
        readObject: vi.fn(async () => ({
          bucket: "canvas-raw",
          key: "canvas/uploads/sales.csv",
          body: Buffer.from("")
        })),
        persistNormalizedTable: vi.fn(async () => ({
          tableName: "tenant_canvas_dataset_ds_1",
          rowCount: 0
        })),
        markDatasetReady: vi.fn(async () => undefined),
        markJobReady: vi.fn(async () => undefined),
        markDatasetFailed,
        markJobFailed,
        now: () => new Date("2026-04-06T10:00:00.000Z")
      })
    ).rejects.toThrow("CSV import payload is empty");

    expect(markDatasetFailed).toHaveBeenCalledWith({
      tenantId: "canvas",
      datasetId: "ds_1",
      warnings: [
        {
          code: "import_failed",
          message: "CSV import payload is empty"
        }
      ]
    });
    expect(markJobFailed).toHaveBeenCalledWith({
      jobId: "job_123",
      completedAt: new Date("2026-04-06T10:00:00.000Z"),
      warnings: [
        {
          code: "import_failed",
          message: "CSV import payload is empty"
        }
      ]
    });
  });
});
