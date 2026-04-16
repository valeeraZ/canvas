export type ImportQueueRedisClient = {
  rpush: (key: string, value: string) => Promise<number>;
  brpop: (
    key: string,
    timeoutSeconds: number
  ) => Promise<readonly [string, string] | null>;
};

export function createImportJobQueue(input: {
  redis: ImportQueueRedisClient;
  queueName?: string;
}) {
  const queueKey = `canvas:${input.queueName ?? "import-jobs"}`;

  return {
    queueKey,
    async enqueue(jobId: string) {
      await input.redis.rpush(queueKey, jobId);
    },
    async dequeue() {
      const result = await input.redis.brpop(queueKey, 0);
      return result?.[1] ?? null;
    }
  };
}
