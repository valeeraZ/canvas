import type { TenantRecord } from "./tenant-repository.js";
import { eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { tenants } from "./schema.js";

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

export function createTenantStore(db: DbClient) {
  return {
    async upsert(input: { slug: string; name: string }) {
      const [tenant] = await db
        .insert(tenants)
        .values({
          slug: input.slug,
          name: input.name
        })
        .onConflictDoUpdate({
          target: tenants.slug,
          set: {
            name: input.name
          }
        })
        .returning();

      return toTenantRecord(tenant);
    },
    async findBySlug(slug: string) {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      return tenant ? toTenantRecord(tenant) : null;
    }
  };
}
