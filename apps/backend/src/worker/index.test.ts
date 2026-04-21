import { describe, expect, it, vi } from "vitest";
import {
  createWorkerJobExecutor,
  createWorkerRunLoop
} from "./index";

describe("createWorkerJobExecutor", () => {
  it("adapts queue job ids into the import executor contract", async () => {
    const runImportJobImpl = vi.fn(async () => undefined);
    const execute = createWorkerJobExecutor({
      storageBucket: "canvas-raw",
      importJobs: {
        claimNext: vi.fn(async () => null),
        markReady: vi.fn(async () => undefined),
        markFailed: vi.fn(async () => undefined)
      },
      datasets: {
        markProcessing: vi.fn(async () => undefined),
        markReady: vi.fn(async () => undefined),
        markFailed: vi.fn(async () => undefined)
      },
      objectReader: {
        read: vi.fn(async () => ({
          bucket: "canvas-raw",
          key: "canvas/uploads/sales.csv",
          body: Buffer.from("")
        }))
      },
      runImportJobImpl
    });

    await execute("job_123");

    expect(runImportJobImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job_123",
        storageBucket: "canvas-raw"
      })
    );
  });

  it("does not expose row persistence to profiling jobs", async () => {
    const runImportJobImpl = vi.fn(async (input) => input);
    const execute = createWorkerJobExecutor({
      storageBucket: "canvas-raw",
      importJobs: {
        claimNext: vi.fn(async () => null),
        markReady: vi.fn(async () => undefined),
        markFailed: vi.fn(async () => undefined)
      },
      datasets: {
        markProcessing: vi.fn(async () => undefined),
        markReady: vi.fn(async () => undefined),
        markFailed: vi.fn(async () => undefined)
      },
      objectReader: {
        read: vi.fn(async () => ({
          bucket: "canvas-raw",
          key: "canvas/uploads/sales.csv",
          body: Buffer.from("")
        }))
      },
      runImportJobImpl
    });

    await execute("job_123");

    expect(runImportJobImpl).toHaveBeenCalledWith(
      expect.not.objectContaining({
        persistNormalizedTable: expect.any(Function)
      })
    );
  });
});

describe("createWorkerRunLoop", () => {
  it("builds a queue loop over the import queue and store reconciliation helpers", async () => {
    const enqueue = vi.fn(async () => undefined);
    const executeJob = vi.fn(async () => undefined);
    const loop = createWorkerRunLoop({
      importQueue: {
        enqueue,
        dequeue: vi.fn(async () => "job_123")
      },
      importJobs: {
        listQueuedJobs: vi.fn(async () => [{ id: "job_123" }]),
        listStaleProcessingJobs: vi.fn(async () => []),
        resetStaleProcessingJobs: vi.fn(async () => 0)
      },
      executeJob
    });

    await loop.reconcile({
      staleBefore: new Date("2026-04-06T10:15:00.000Z")
    });
    await loop.runNext();

    expect(enqueue).toHaveBeenCalledWith("job_123");
    expect(executeJob).toHaveBeenCalledWith("job_123");
  });
});
