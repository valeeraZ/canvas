import type { PrismaClient } from "./generated/prisma/client.js";
import { resolveTenantBySlug, tenantSlugInclude } from "./tenant-slug.js";

export type PrincipalAppPreference = {
  principalId: string;
  appId: string;
  selectedDashboardId: string | null;
};

type PersistedPrincipalAppPreference = {
  principalId: string;
  tenantId: string;
  selectedDashboardId: string | null;
  tenant?: {
    slug: string;
  } | null;
};

export function toPrincipalAppPreference(
  input: PersistedPrincipalAppPreference
): PrincipalAppPreference {
  return {
    principalId: input.principalId,
    appId: input.tenant?.slug ?? input.tenantId,
    selectedDashboardId: input.selectedDashboardId
  };
}

export function createPrincipalAppPreferenceStore(prisma: PrismaClient) {
  return {
    async get(input: { principalId: string; appId: string }) {
      const tenant = await resolveTenantBySlug(prisma, input.appId);
      const preference = await prisma.principalAppPreference.findUnique({
        where: {
          principalId_tenantId: {
            principalId: input.principalId,
            tenantId: tenant.id
          }
        },
        include: tenantSlugInclude
      });

      return preference ? toPrincipalAppPreference(preference) : null;
    },
    async set(input: PrincipalAppPreference) {
      const tenant = await resolveTenantBySlug(prisma, input.appId);
      const preference = await prisma.principalAppPreference.upsert({
        where: {
          principalId_tenantId: {
            principalId: input.principalId,
            tenantId: tenant.id
          }
        },
        update: {
          selectedDashboardId: input.selectedDashboardId
        },
        create: {
          principalId: input.principalId,
          tenantId: tenant.id,
          selectedDashboardId: input.selectedDashboardId
        },
        include: tenantSlugInclude
      });

      return toPrincipalAppPreference(preference);
    }
  };
}
