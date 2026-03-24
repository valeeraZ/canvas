import type { TenantRecord } from "./tenant-repository.js";
import type { PrismaClient } from "./generated/prisma/client.js";

type PersistedTenant = {
  id: string;
  slug: string;
  name: string;
};

export function toTenantRecord(input: PersistedTenant): TenantRecord {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name
  };
}

export function createTenantStore(prisma: PrismaClient) {
  return {
    async upsert(input: { slug: string; name: string }) {
      const tenant = await prisma.tenant.upsert({
        where: {
          slug: input.slug
        },
        update: {
          name: input.name
        },
        create: {
          slug: input.slug,
          name: input.name
        }
      });

      return toTenantRecord(tenant);
    },
    async findBySlug(slug: string) {
      const tenant = await prisma.tenant.findUnique({
        where: {
          slug
        }
      });

      return tenant ? toTenantRecord(tenant) : null;
    }
  };
}
