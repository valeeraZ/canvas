import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export type DbClientConfig = {
  connectionString: string;
};

export function createDbClient(config: DbClientConfig) {
  const adapter = new PrismaPg({
    connectionString: config.connectionString
  });

  return new PrismaClient({
    adapter
  });
}
