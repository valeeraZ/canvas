export function createImportQueueLoop(input: {
  queue: {
    enqueue(jobId: string): Promise<void>;
    dequeue(): Promise<string | null>;
  };
  jobs: {
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
  return {
    async reconcile(inputParams: { staleBefore: Date }) {
      const queuedJobs = await input.jobs.listQueuedJobs();
      const staleJobs = await input.jobs.listStaleProcessingJobs(inputParams);

      await input.jobs.resetStaleProcessingJobs(inputParams);

      for (const job of [...queuedJobs, ...staleJobs]) {
        await input.queue.enqueue(job.id);
      }
    },
    async runNext() {
      const jobId = await input.queue.dequeue();

      if (!jobId) {
        return;
      }

      await input.executeJob(jobId);
    }
  };
}
