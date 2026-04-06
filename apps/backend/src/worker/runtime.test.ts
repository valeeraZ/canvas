import { describe, expect, it, vi } from "vitest";
import { createWorkerRuntime } from "./runtime";

describe("createWorkerRuntime", () => {
  it("starts worker dependencies without booting an API listener", async () => {
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
    const runLoop = vi.fn(async () => undefined);

    const runtime = createWorkerRuntime({
      config: {
        runtimeMode: "worker",
        prettyLogs: false
      },
      db,
      cache,
      queue,
      runLoop
    });

    await runtime.start();
    await runtime.shutdown();

    expect(db.$connect).toHaveBeenCalledOnce();
    expect(queue.connect).toHaveBeenCalledOnce();
    expect(runLoop).toHaveBeenCalledOnce();
    expect(queue.disconnect).toHaveBeenCalledOnce();
    expect(db.$disconnect).toHaveBeenCalledOnce();
    expect(cache.disconnect).toHaveBeenCalledOnce();
  });

  it("starts the run loop without blocking startup completion", async () => {
    let resolveLoop: (() => void) | undefined;
    const runLoop = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoop = resolve;
        })
    );
    let startupCompleted = false;

    const runtime = createWorkerRuntime({
      config: {
        runtimeMode: "worker",
        prettyLogs: false
      },
      db: {
        $connect: vi.fn(async () => undefined),
        $disconnect: vi.fn(async () => undefined)
      },
      cache: {
        disconnect: vi.fn(async () => undefined)
      },
      queue: {
        connect: vi.fn(async () => undefined),
        disconnect: vi.fn(async () => undefined)
      },
      runLoop
    });

    const startPromise = runtime.start().then(() => {
      startupCompleted = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(runLoop).toHaveBeenCalledOnce();
    expect(startupCompleted).toBe(true);
    resolveLoop?.();
    await startPromise;
    await runtime.shutdown();
  });
});
