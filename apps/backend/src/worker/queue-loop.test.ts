import { describe, expect, it, vi } from "vitest";
import { createImportQueueLoop } from "./queue-loop";

describe("createImportQueueLoop", () => {
  it("re-enqueues queued jobs discovered during reconciliation", async () => {
    const enqueue = vi.fn(async () => undefined);
    const loop = createImportQueueLoop({
      queue: {
        enqueue,
        dequeue: vi.fn(async () => null)
      },
      jobs: {
        listQueuedJobs: vi.fn(async () => [
          {
            id: "job_123"
          }
        ]),
        listStaleProcessingJobs: vi.fn(async () => []),
        resetStaleProcessingJobs: vi.fn(async () => 0)
      },
      executeJob: vi.fn(async () => undefined)
    });

    await loop.reconcile({
      staleBefore: new Date("2026-04-06T10:15:00.000Z")
    });

    expect(enqueue).toHaveBeenCalledWith("job_123");
  });

  it("resets stale processing jobs and re-enqueues them", async () => {
    const enqueue = vi.fn(async () => undefined);
    const resetStaleProcessingJobs = vi.fn(async () => 1);
    const loop = createImportQueueLoop({
      queue: {
        enqueue,
        dequeue: vi.fn(async () => null)
      },
      jobs: {
        listQueuedJobs: vi.fn(async () => []),
        listStaleProcessingJobs: vi.fn(async () => [
          {
            id: "job_456"
          }
        ]),
        resetStaleProcessingJobs
      },
      executeJob: vi.fn(async () => undefined)
    });

    await loop.reconcile({
      staleBefore: new Date("2026-04-06T10:15:00.000Z")
    });

    expect(resetStaleProcessingJobs).toHaveBeenCalledOnce();
    expect(enqueue).toHaveBeenCalledWith("job_456");
  });

  it("dequeues one job id at a time and hands it to the executor", async () => {
    const executeJob = vi.fn(async () => undefined);
    const loop = createImportQueueLoop({
      queue: {
        enqueue: vi.fn(async () => undefined),
        dequeue: vi.fn(async () => "job_789")
      },
      jobs: {
        listQueuedJobs: vi.fn(async () => []),
        listStaleProcessingJobs: vi.fn(async () => []),
        resetStaleProcessingJobs: vi.fn(async () => 0)
      },
      executeJob
    });

    await loop.runNext();

    expect(executeJob).toHaveBeenCalledWith("job_789");
  });
});
