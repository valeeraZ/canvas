export function createWorkerRuntime(input: {
  config: {
    runtimeMode: "worker";
    prettyLogs: boolean;
  };
  db?: {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
  };
  cache?: {
    disconnect(): Promise<void>;
  };
  queue: {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  };
  runLoop: () => Promise<void>;
}) {
  let runLoopPromise: Promise<void> | null = null;

  return {
    async start() {
      await input.db?.$connect();
      await input.queue.connect();
      runLoopPromise = input.runLoop();
    },
    async shutdown() {
      await input.queue.disconnect();
      await runLoopPromise?.catch(() => undefined);
      await input.db?.$disconnect();
      await input.cache?.disconnect();
    }
  };
}
