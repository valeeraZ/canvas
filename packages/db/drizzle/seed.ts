import "dotenv/config";
import { createDbClient } from "../src/client.js";
import { buildSeedTenant } from "../src/seed.js";
import { tenants } from "../src/schema.js";

export function buildDrizzleSeed() {
  const tenant = buildSeedTenant();

  return {
    tenants: [tenant]
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  const db = createDbClient({
    connectionString: databaseUrl
  });
  const seed = buildDrizzleSeed();

  try {
    for (const tenant of seed.tenants) {
      await db
        .insert(tenants)
        .values(tenant)
        .onConflictDoUpdate({
          target: tenants.slug,
          set: {
            name: tenant.name
          }
        });
    }
  } finally {
    await db.$disconnect();
  }
}

void main();
