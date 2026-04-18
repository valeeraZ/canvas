import { createClient, type RedisClientType } from "redis";

export type QueueClientConfig = {
  redisUrl: string;
};

type QueueRedisClient = Pick<
  RedisClientType,
  "connect" | "quit" | "rPush" | "brPop"
>;

export function createQueueClient(
  config: QueueClientConfig,
  input?: {
    createRedisClient?: (config: QueueClientConfig) => QueueRedisClient;
  }
) {
  const redis =
    input?.createRedisClient?.(config) ??
    createClient({
      url: config.redisUrl
    });

  return {
    redisUrl: config.redisUrl,
    async connect() {
      await redis.connect();
    },
    async disconnect() {
      await redis.quit();
    },
    async enqueue(topic: string, payload: unknown) {
      return redis.rPush(topic, JSON.stringify(payload));
    },
    async rpush(key: string, value: string) {
      return redis.rPush(key, value);
    },
    async brpop(key: string, timeoutSeconds: number) {
      const result = await redis.brPop(key, timeoutSeconds);
      return result ? ([result.key, result.element] as const) : null;
    }
  };
}
