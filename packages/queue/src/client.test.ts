import { describe, expect, it, vi } from "vitest";
import { createQueueClient } from "./client";

describe("createQueueClient", () => {
  it("connects, disconnects, and exposes redis list operations", async () => {
    const redis = {
      connect: vi.fn(async () => undefined),
      quit: vi.fn(async () => "OK"),
      rPush: vi.fn(async () => 1),
      brPop: vi.fn(async () => ({
        key: "canvas:import-jobs",
        element: "job_123"
      }))
    };

    const client = createQueueClient(
      {
        redisUrl: "redis://127.0.0.1:6379"
      },
      {
        createRedisClient: vi.fn(() => redis as never)
      }
    );

    await client.connect();
    await client.rpush("canvas:import-jobs", "job_123");
    const job = await client.brpop("canvas:import-jobs", 0);
    await client.disconnect();

    expect(redis.connect).toHaveBeenCalledOnce();
    expect(redis.rPush).toHaveBeenCalledWith("canvas:import-jobs", "job_123");
    expect(job).toEqual(["canvas:import-jobs", "job_123"]);
    expect(redis.quit).toHaveBeenCalledOnce();
  });
});
