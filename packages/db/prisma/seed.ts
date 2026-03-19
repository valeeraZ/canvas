import "dotenv/config";
import { createDbClient } from "../src/client";
import { buildSeedTenant } from "../src/seed";

export function buildPrismaSeed() {
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

  const prisma = createDbClient({
    connectionString: databaseUrl
  });
  const seed = buildPrismaSeed();

  try {
    for (const tenant of seed.tenants) {
      await prisma.tenant.upsert({
        where: {
          slug: tenant.slug
        },
        update: {
          name: tenant.name
        },
        create: tenant
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
