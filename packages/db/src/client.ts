export type DbClientConfig = {
  connectionString: string;
};

export function createDbClient(config: DbClientConfig) {
  return {
    connectionString: config.connectionString,
    async healthcheck() {
      return { ok: true as const };
    }
  };
}
