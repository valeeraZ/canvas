import type { DashboardRecord } from "../../../packages/contracts/src/dashboards.js";
import { and, asc, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { dashboards, tenants } from "./schema.js";
import { resolveTenantBySlug } from "./tenant-slug.js";

type PersistedDashboard = {
  id: string;
  tenantId: string;
  name: string;
  workbookId: string | null;
  status: string;
  createdByExternalUserId: string | null;
  createdByDisplayName: string | null;
  createdAt: Date;
  updatedAt: Date;
  tenant?: {
    slug: string;
  } | null;
};

export function toDashboardRecord(input: PersistedDashboard): DashboardRecord {
  return {
    id: input.id,
    tenantId: input.tenant?.slug ?? input.tenantId,
    name: input.name,
    workbookId: input.workbookId,
    status: input.status,
    author: {
      externalUserId: input.createdByExternalUserId,
      displayName: input.createdByDisplayName
    },
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString()
  };
}

function dashboardRecordSelection() {
  return {
    id: dashboards.id,
    tenantId: dashboards.tenantId,
    name: dashboards.name,
    workbookId: dashboards.workbookId,
    status: dashboards.status,
    createdByExternalUserId: dashboards.createdByExternalUserId,
    createdByDisplayName: dashboards.createdByDisplayName,
    createdAt: dashboards.createdAt,
    updatedAt: dashboards.updatedAt,
    tenantSlug: tenants.slug
  };
}

function toDashboardRecordWithSlug(
  input: Omit<PersistedDashboard, "tenant"> & { tenantSlug: string }
) {
  return toDashboardRecord({
    ...input,
    tenant: { slug: input.tenantSlug }
  });
}

export function createDashboardStore(db: DbClient) {
  return {
    async create(input: {
      tenantId: string;
      name: string;
      workbookId?: string;
      createdByExternalUserId?: string;
      createdByDisplayName?: string;
    }) {
      const tenant = await resolveTenantBySlug(db, input.tenantId);
      const now = new Date();
      const [dashboard] = await db
        .insert(dashboards)
        .values({
          tenantId: tenant.id,
          name: input.name,
          workbookId: input.workbookId ?? null,
          status: "active",
          createdByExternalUserId: input.createdByExternalUserId ?? null,
          createdByDisplayName: input.createdByDisplayName ?? null,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return toDashboardRecord({ ...dashboard, tenant: { slug: tenant.slug } });
    },
    async listByTenant(tenantId: string) {
      const rows = await db
        .select(dashboardRecordSelection())
        .from(dashboards)
        .innerJoin(tenants, eq(dashboards.tenantId, tenants.id))
        .where(eq(tenants.slug, tenantId))
        .orderBy(asc(dashboards.name));

      return rows.map(toDashboardRecordWithSlug);
    },
    async findByTenantAndId(tenantId: string, dashboardId: string) {
      const [dashboard] = await db
        .select(dashboardRecordSelection())
        .from(dashboards)
        .innerJoin(tenants, eq(dashboards.tenantId, tenants.id))
        .where(and(eq(dashboards.id, dashboardId), eq(tenants.slug, tenantId)))
        .limit(1);

      return dashboard ? toDashboardRecordWithSlug(dashboard) : null;
    },
    async rename(input: {
      tenantId: string;
      dashboardId: string;
      name: string;
    }) {
      const tenant = await resolveTenantBySlug(db, input.tenantId);
      const [dashboard] = await db
        .update(dashboards)
        .set({
          name: input.name,
          updatedAt: new Date()
        })
        .where(and(eq(dashboards.id, input.dashboardId), eq(dashboards.tenantId, tenant.id)))
        .returning();

      if (!dashboard) {
        return null;
      }

      return toDashboardRecord({ ...dashboard, tenant: { slug: tenant.slug } });
    },
    async remove(input: {
      tenantId: string;
      dashboardId: string;
    }) {
      const tenant = await resolveTenantBySlug(db, input.tenantId);
      const [dashboard] = await db
        .delete(dashboards)
        .where(and(eq(dashboards.id, input.dashboardId), eq(dashboards.tenantId, tenant.id)))
        .returning({ id: dashboards.id });

      if (!dashboard) {
        return null;
      }

      return {
        deletedDashboardId: dashboard.id
      };
    }
  };
}
