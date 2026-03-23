import type { ExpiringStore } from "./expiring-store";

type Entry = {
  value: string;
  expiresAt: number;
};

export function createMemoryExpiringStore(): ExpiringStore {
  const entries = new Map<string, Entry>();

  function read(key: string) {
    const entry = entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return null;
    }

    return entry.value;
  }

  return {
    async get(key) {
      return read(key);
    },
    async set(key, value, ttlSeconds) {
      entries.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000
      });
    },
    async delete(key) {
      entries.delete(key);
    }
  };
}
