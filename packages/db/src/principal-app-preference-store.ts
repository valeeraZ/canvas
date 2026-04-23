import { and, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { principalAppPreferences } from "./schema.js";
import { resolveTenantBySlug } from "./tenant-slug.js";

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

export function createPrincipalAppPreferenceStore(db: DbClient) {
  return {
    async get(input: { principalId: string; appId: string }) {
      const tenant = await resolveTenantBySlug(db, input.appId);
      const [preference] = await db
        .select()
        .from(principalAppPreferences)
        .where(
          and(
            eq(principalAppPreferences.principalId, input.principalId),
            eq(principalAppPreferences.tenantId, tenant.id)
          )
        )
        .limit(1);

      return preference
        ? toPrincipalAppPreference({
            ...preference,
            tenant: { slug: tenant.slug }
          })
        : null;
    },
    async set(input: PrincipalAppPreference) {
      const tenant = await resolveTenantBySlug(db, input.appId);
      const [preference] = await db
        .insert(principalAppPreferences)
        .values({
          principalId: input.principalId,
          tenantId: tenant.id,
          selectedDashboardId: input.selectedDashboardId
        })
        .onConflictDoUpdate({
          target: [
            principalAppPreferences.principalId,
            principalAppPreferences.tenantId
          ],
          set: {
            selectedDashboardId: input.selectedDashboardId
          }
        })
        .returning();

      return toPrincipalAppPreference({
        ...preference,
        tenant: { slug: tenant.slug }
      });
    }
  };
}
