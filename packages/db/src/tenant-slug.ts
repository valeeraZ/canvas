import type { PrismaClient } from "./generated/prisma/client.js";

type TenantLookupClient = Pick<PrismaClient, "tenant">;

export async function resolveTenantBySlug(
  prisma: TenantLookupClient,
  tenantSlug: string
) {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: tenantSlug
    },
    select: {
      id: true,
      slug: true
    }
  });

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
