import Redis from "ioredis";
import type { ExpiringStore } from "./expiring-store.js";

export type RedisExpiringStore = ExpiringStore & {
  disconnect(): Promise<void>;
};

export function createRedisExpiringStore(redisUrl: string): RedisExpiringStore {
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });

  let connectPromise: Promise<void> | null = null;

  async function ensureConnected() {
    if (client.status === "ready") {
      return;
    }

    if (!connectPromise) {
      connectPromise = client.connect().catch((error: unknown) => {
        connectPromise = null;
        throw error;
      });
    }

    await connectPromise;
  }

  return {
    async get(key) {
      await ensureConnected();
      return client.get(key);
    },
    async set(key, value, ttlSeconds) {
      await ensureConnected();
      await client.set(key, value, "EX", ttlSeconds);
    },
    async delete(key) {
      await ensureConnected();
      await client.del(key);
    },
    async disconnect() {
      if (client.status === "end") {
        return;
      }

      await client.quit().catch(async () => {
        client.disconnect();
      });
    }
  };
}
