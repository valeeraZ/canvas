import type { PrismaClient } from "./generated/prisma/client";

export type PrincipalAppPreference = {
  principalId: string;
  appId: string;
  selectedDashboardId: string | null;
};

type PersistedPrincipalAppPreference = {
  principalId: string;
  tenantId: string;
  selectedDashboardId: string | null;
};

export function toPrincipalAppPreference(
  input: PersistedPrincipalAppPreference
): PrincipalAppPreference {
  return {
    principalId: input.principalId,
    appId: input.tenantId,
    selectedDashboardId: input.selectedDashboardId
  };
}

export function createPrincipalAppPreferenceStore(prisma: PrismaClient) {
  return {
    async get(input: { principalId: string; appId: string }) {
      const preference = await prisma.principalAppPreference.findUnique({
        where: {
          principalId_tenantId: {
            principalId: input.principalId,
            tenantId: input.appId
          }
        }
      });

      return preference ? toPrincipalAppPreference(preference) : null;
    },
    async set(input: PrincipalAppPreference) {
      const preference = await prisma.principalAppPreference.upsert({
        where: {
          principalId_tenantId: {
            principalId: input.principalId,
            tenantId: input.appId
          }
        },
        update: {
          selectedDashboardId: input.selectedDashboardId
        },
        create: {
          principalId: input.principalId,
          tenantId: input.appId,
          selectedDashboardId: input.selectedDashboardId
        }
      });

      return toPrincipalAppPreference(preference);
    }
  };
}
