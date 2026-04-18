import { describe, expect, it, vi } from "vitest";
import { createImportJobQueue } from "./import-job-queue";

describe("createImportJobQueue", () => {
  it("enqueues a job id onto the import queue", async () => {
    const rpush = vi.fn().mockResolvedValue(1);
    const queue = createImportJobQueue({
      redis: {
        rpush,
        brpop: vi.fn()
      }
    });

    await queue.enqueue("job_123");

    expect(rpush).toHaveBeenCalledWith("canvas:import-jobs", "job_123");
  });

  it("dequeues the next job id from the import queue", async () => {
    const brpop = vi
      .fn()
      .mockResolvedValue(["canvas:import-jobs", "job_123"] as const);
    const queue = createImportJobQueue({
      redis: {
        rpush: vi.fn(),
        brpop
      }
    });

    await expect(queue.dequeue()).resolves.toBe("job_123");
    expect(brpop).toHaveBeenCalledWith("canvas:import-jobs", 0);
  });

  it("uses a stable namespaced queue key", async () => {
    const rpush = vi.fn().mockResolvedValue(1);
    const queue = createImportJobQueue({
      redis: {
        rpush,
        brpop: vi.fn()
      },
      queueName: "dataset-imports"
    });

    await queue.enqueue("job_123");

    expect(rpush).toHaveBeenCalledWith("canvas:dataset-imports", "job_123");
  });
});
