import { pathToFileURL } from "node:url";
import { createApiApp } from "./api/app";
import {
  createDatasetRowStore,
  createDatasetStore,
  createImportJobStore
} from "../../../packages/db/src/index.js";
import { createImportJobQueue } from "../../../packages/queue/src/index.js";
import {
  createObjectReader,
  createS3ObjectReader
} from "../../../packages/storage/src/index.js";
import {
  type BackendRuntime,
  createBackendRuntime,
  createBackendRuntimeConfig,
  startBackendRuntime
} from "./server";
import {
  createWorkerJobExecutor,
  createWorkerRunLoop,
  createWorkerRuntime
} from "./worker";

export { createApiApp } from "./api/app";
export type { CreateApiAppOptions } from "./api/app";
export {
  createBackendRuntime,
  createBackendRuntimeConfig,
  startBackendRuntime
} from "./server";

export function createWorkerModeRuntime(input: {
  runtime: Pick<BackendRuntime, "app" | "db" | "cache" | "queue" | "config">;
  now?: () => Date;
  createImportJobStoreImpl?: typeof createImportJobStore;
  createDatasetStoreImpl?: typeof createDatasetStore;
  createDatasetRowStoreImpl?: typeof createDatasetRowStore;
  createImportJobQueueImpl?: typeof createImportJobQueue;
  createS3ObjectReaderImpl?: typeof createS3ObjectReader;
  createObjectReaderImpl?: typeof createObjectReader;
  createWorkerJobExecutorImpl?: typeof createWorkerJobExecutor;
  createWorkerRunLoopImpl?: typeof createWorkerRunLoop;
  createWorkerRuntimeImpl?: typeof createWorkerRuntime;
}) {
  if (!input.runtime.db || !input.runtime.queue || !input.runtime.config.storage) {
    throw new Error(
      "Worker mode requires database, Redis, and storage configuration"
    );
  }

  const createImportJobStoreImpl =
    input.createImportJobStoreImpl ?? createImportJobStore;
  const createDatasetStoreImpl =
    input.createDatasetStoreImpl ?? createDatasetStore;
  const createDatasetRowStoreImpl =
    input.createDatasetRowStoreImpl ?? createDatasetRowStore;
  const createImportJobQueueImpl =
    input.createImportJobQueueImpl ?? createImportJobQueue;
  const createS3ObjectReaderImpl =
    input.createS3ObjectReaderImpl ?? createS3ObjectReader;
  const createObjectReaderImpl =
    input.createObjectReaderImpl ?? createObjectReader;
  const createWorkerJobExecutorImpl =
    input.createWorkerJobExecutorImpl ?? createWorkerJobExecutor;
  const createWorkerRunLoopImpl =
    input.createWorkerRunLoopImpl ?? createWorkerRunLoop;
  const createWorkerRuntimeImpl =
    input.createWorkerRuntimeImpl ?? createWorkerRuntime;
  const now = input.now ?? (() => new Date());

  const importJobs = createImportJobStoreImpl(input.runtime.db);
  const datasets = createDatasetStoreImpl(input.runtime.db);
  const datasetRows = createDatasetRowStoreImpl(input.runtime.db);
  const importQueue = createImportJobQueueImpl({
    redis: input.runtime.queue
  });
  const objectReader = createObjectReaderImpl(
    createS3ObjectReaderImpl(input.runtime.config.storage)
  );
  const executeJob = createWorkerJobExecutorImpl({
    datasetRows,
    storageBucket: input.runtime.config.storage.bucket,
    importJobs,
    datasets,
    objectReader
  });
  const loop = createWorkerRunLoopImpl({
    importQueue,
    importJobs,
    executeJob
  });

  return createWorkerRuntimeImpl({
    config: {
      runtimeMode: "worker",
      prettyLogs: input.runtime.config.prettyLogs
    },
    db: input.runtime.db,
    cache: input.runtime.cache,
    queue: input.runtime.queue,
    runLoop: async () => {
      await loop.reconcile({
        staleBefore: new Date(now().getTime() - 15 * 60 * 1000)
      });

      while (true) {
        await loop.runNext();
      }
    }
  });
}

async function run() {
  const config = createBackendRuntimeConfig(process.env);
  const runtime =
    config.runtimeMode === "worker"
      ? createBackendRuntime(config)
      : await startBackendRuntime(config);
  let workerRuntime:
    | ReturnType<typeof createWorkerModeRuntime>
    | undefined;

  const shutdown =
    config.runtimeMode === "worker"
      ? async () => {
          await workerRuntime?.shutdown();
          await runtime.app.close();
        }
      : async () => {
          await runtime.app.close();
          await runtime.db?.$disconnect();
          await runtime.queue?.disconnect();
          await runtime.cache?.disconnect();
        };

  if (config.runtimeMode === "worker") {
    workerRuntime = createWorkerModeRuntime({
      runtime
    });
    await workerRuntime.start();
  }

  process.on("SIGINT", async () => {
    await shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await shutdown();
    process.exit(0);
  });

  console.log(
    config.runtimeMode === "worker"
      ? `Canvas worker running for app ${runtime.config.appName}`
      : `Canvas backend listening at http://${runtime.config.host}:${runtime.config.port}`
  );
}

const entrypoint = process.argv[1];

if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  run().catch((error: unknown) => {
    console.error("Failed to start Canvas backend", error);
    process.exit(1);
  });
}
