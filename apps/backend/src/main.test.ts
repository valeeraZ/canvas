import { describe, expect, it, vi } from "vitest";
import { createWorkerModeRuntime } from "./main";

describe("createWorkerModeRuntime", () => {
  it("requires database, Redis, and storage configuration", () => {
    expect(() =>
      createWorkerModeRuntime({
        runtime: {
          app: {
            close: vi.fn(async () => undefined)
          },
          config: {
            runtimeMode: "worker",
            prettyLogs: false
          }
        }
      })
    ).toThrowError(
      "Worker mode requires database, Redis, and storage configuration"
    );
  });

  it("composes the worker runtime and runs reconciliation before dequeueing", async () => {
    const now = new Date("2026-04-06T12:30:00.000Z");
    const db = {
      $connect: vi.fn(async () => undefined),
      $disconnect: vi.fn(async () => undefined)
    };
    const cache = {
      disconnect: vi.fn(async () => undefined)
    };
    const queue = {
      connect: vi.fn(async () => undefined),
      disconnect: vi.fn(async () => undefined)
    };
    const importJobs = {
      claimNext: vi.fn(async () => null),
      markReady: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
      listQueuedJobs: vi.fn(async () => []),
      listStaleProcessingJobs: vi.fn(async () => []),
      resetStaleProcessingJobs: vi.fn(async () => 0)
    };
    const datasets = {
      markProcessing: vi.fn(async () => undefined),
      markReady: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined)
    };
    const importQueue = {
      enqueue: vi.fn(async () => undefined),
      dequeue: vi.fn(async () => null)
    };
    const objectReader = {
      read: vi.fn(async () => ({
        bucket: "canvas-raw",
        key: "canvas/uploads/sales.csv",
        body: Buffer.from("")
      }))
    };
    const executeJob = vi.fn(async () => undefined);
    const stopLoop = new Error("stop-loop");
    const loop = {
      reconcile: vi.fn(async () => undefined),
      runNext: vi.fn(async () => {
        throw stopLoop;
      })
    };
    const createImportJobStoreImpl = vi.fn(() => importJobs);
    const createDatasetStoreImpl = vi.fn(() => datasets);
    const createImportJobQueueImpl = vi.fn(() => importQueue);
    const createS3ObjectReaderImpl = vi.fn(() => ({
      getObject: vi.fn(async () => Buffer.from(""))
    }));
    const createObjectReaderImpl = vi.fn(() => objectReader);
    const createWorkerJobExecutorImpl = vi.fn(() => executeJob);
    const createWorkerRunLoopImpl = vi.fn(() => loop);
    const createWorkerRuntimeImpl = vi.fn((input) => ({
      start: vi.fn(async () => undefined),
      shutdown: vi.fn(async () => undefined),
      input
    }));

    createWorkerModeRuntime({
      runtime: {
        app: {
          close: vi.fn(async () => undefined)
        },
        db,
        cache,
        queue,
        config: {
          runtimeMode: "worker",
          prettyLogs: true,
          storage: {
            endpoint: "http://127.0.0.1:9000",
            region: "us-east-1",
            accessKeyId: "minioadmin",
            secretAccessKey: "minioadmin",
            bucket: "canvas-raw",
            forcePathStyle: true
          }
        }
      },
      now: () => now,
      createImportJobStoreImpl,
      createDatasetStoreImpl,
      createImportJobQueueImpl,
      createS3ObjectReaderImpl,
      createObjectReaderImpl,
      createWorkerJobExecutorImpl,
      createWorkerRunLoopImpl,
      createWorkerRuntimeImpl
    });

    expect(createImportJobStoreImpl).toHaveBeenCalledWith(db);
    expect(createDatasetStoreImpl).toHaveBeenCalledWith(db);
    expect(createImportJobQueueImpl).toHaveBeenCalledWith({
      redis: queue
    });
    expect(createS3ObjectReaderImpl).toHaveBeenCalledWith({
      endpoint: "http://127.0.0.1:9000",
      region: "us-east-1",
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin",
      bucket: "canvas-raw",
      forcePathStyle: true
    });
    expect(createObjectReaderImpl).toHaveBeenCalled();
    expect(createWorkerJobExecutorImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        storageBucket: "canvas-raw",
        importJobs,
        datasets,
        objectReader
      })
    );
    expect(createWorkerRunLoopImpl).toHaveBeenCalledWith({
      importQueue,
      importJobs,
      executeJob
    });
    expect(createWorkerRuntimeImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        db,
        cache,
        queue,
        config: {
          runtimeMode: "worker",
          prettyLogs: true
        },
        runLoop: expect.any(Function)
      })
    );

    const [{ runLoop }] = createWorkerRuntimeImpl.mock.calls.map(
      ([input]) => input
    );

    await expect(runLoop()).rejects.toThrow("stop-loop");
    expect(loop.reconcile).toHaveBeenCalledWith({
      staleBefore: new Date("2026-04-06T12:15:00.000Z")
    });
    expect(loop.runNext).toHaveBeenCalledOnce();
  });
});
