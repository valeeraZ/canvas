import { eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { tenants } from "./schema.js";

type TenantLookupClient = Pick<DbClient, "select">;

export async function resolveTenantBySlug(
  db: TenantLookupClient,
  tenantSlug: string
) {
  const [tenant] = await db
    .select({
      id: tenants.id,
      slug: tenants.slug
    })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    throw new Error(`App not found: ${tenantSlug}`);
  }

  return tenant;
}

export const tenantSlugInclude = {
  tenant: {
    select: {
      slug: true
    }
  }
} as const;
