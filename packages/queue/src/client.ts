export type QueueClientConfig = {
  redisUrl: string;
};

export function createQueueClient(config: QueueClientConfig) {
  return {
    redisUrl: config.redisUrl,
    async enqueue(topic: string, payload: unknown) {
      return { topic, payload };
    }
  };
}
