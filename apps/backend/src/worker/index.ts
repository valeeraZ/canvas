import { runImportJob } from "./handlers/run-import-job";
import { createImportQueueLoop } from "./queue-loop";

export { runImportJob } from "./handlers/run-import-job";
export { createWorkerRuntime } from "./runtime";
export { createImportQueueLoop } from "./queue-loop";

export function createWorkerJobExecutor(input: {
  storageBucket: string;
  importJobs: {
    claimNext(input: {
      importJobId: string;
      claimedAt: Date;
    }): Promise<{
      id: string;
      datasetId: string;
      tenantId: string;
      objectKey: string;
    } | null>;
    markReady(input: {
      importJobId: string;
      completedAt: Date;
    }): Promise<unknown>;
    markFailed(input: {
      importJobId: string;
      completedAt: Date;
      warnings: Array<{ code: string; message?: string }>;
    }): Promise<unknown>;
  };
  datasets: {
    markProcessing(input: {
      tenantId: string;
      datasetId: string;
    }): Promise<unknown>;
    markReady(input: {
      tenantId: string;
      datasetId: string;
      preview: unknown;
    }): Promise<unknown>;
    markFailed(input: {
      tenantId: string;
      datasetId: string;
      warnings: Array<{ code: string; message?: string }>;
    }): Promise<unknown>;
  };
  objectReader: {
    read(input: {
      bucket: string;
      key: string;
    }): Promise<{
      bucket: string;
      key: string;
      body: Buffer;
    }>;
  };
  runImportJobImpl?: typeof runImportJob;
}) {
  const runImportJobImpl = input.runImportJobImpl ?? runImportJob;

  return async function executeJob(jobId: string) {
    return runImportJobImpl({
      jobId,
      storageBucket: input.storageBucket,
      claimJob: ({ jobId, claimedAt }) =>
        input.importJobs.claimNext({
          importJobId: jobId,
          claimedAt
      }),
      markDatasetProcessing: input.datasets.markProcessing,
      readObject: input.objectReader.read,
      markDatasetReady: input.datasets.markReady,
      markJobReady: ({ jobId, completedAt }) =>
        input.importJobs.markReady({
          importJobId: jobId,
          completedAt
        }),
      markDatasetFailed: input.datasets.markFailed,
      markJobFailed: ({ jobId, completedAt, warnings }) =>
        input.importJobs.markFailed({
          importJobId: jobId,
          completedAt,
          warnings
        })
    });
  };
}

export function createWorkerRunLoop(input: {
  importQueue: {
    enqueue(jobId: string): Promise<void>;
    dequeue(): Promise<string | null>;
  };
  importJobs: {
    listQueuedJobs(): Promise<Array<{ id: string }>>;
    listStaleProcessingJobs(input: {
      staleBefore: Date;
    }): Promise<Array<{ id: string }>>;
    resetStaleProcessingJobs(input: {
      staleBefore: Date;
    }): Promise<number>;
  };
  executeJob: (jobId: string) => Promise<void>;
}) {
  return createImportQueueLoop({
    queue: input.importQueue,
    jobs: input.importJobs,
    executeJob: input.executeJob
  });
}
