import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

export type DbClientConfig = {
  connectionString: string;
};

export type DbClient = NodePgDatabase<typeof schema> & {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
};

export function createDbClient(config: DbClientConfig): DbClient {
  const pool = new Pool({
    connectionString: config.connectionString
  });
  const db = drizzle(pool, { schema });

  return Object.assign(db, {
    async $connect() {
      const client = await pool.connect();
      client.release();
    },
    async $disconnect() {
      await pool.end();
    }
  });
}
