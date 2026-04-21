import type { DashboardRecord } from "../../../packages/contracts/src/dashboards.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { resolveTenantBySlug, tenantSlugInclude } from "./tenant-slug.js";

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

export function createDashboardStore(prisma: PrismaClient) {
  return {
    async create(input: {
      tenantId: string;
      name: string;
      workbookId?: string;
      createdByExternalUserId?: string;
      createdByDisplayName?: string;
    }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      const dashboard = await prisma.dashboard.create({
        data: {
          tenantId: tenant.id,
          name: input.name,
          workbookId: input.workbookId ?? null,
          status: "active",
          createdByExternalUserId: input.createdByExternalUserId ?? null,
          createdByDisplayName: input.createdByDisplayName ?? null
        },
        include: tenantSlugInclude
      });

      return toDashboardRecord(dashboard);
    },
    async listByTenant(tenantId: string) {
      const dashboards = await prisma.dashboard.findMany({
        where: {
          tenant: {
            slug: tenantId
          }
        },
        include: tenantSlugInclude,
        orderBy: {
          name: "asc"
        }
      });

      return dashboards.map(toDashboardRecord);
    },
    async findByTenantAndId(tenantId: string, dashboardId: string) {
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenant: {
            slug: tenantId
          }
        },
        include: tenantSlugInclude
      });

      return dashboard ? toDashboardRecord(dashboard) : null;
    },
    async rename(input: {
      tenantId: string;
      dashboardId: string;
      name: string;
    }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      try {
        const dashboard = await prisma.dashboard.update({
          where: {
            id: input.dashboardId,
            tenantId: tenant.id
          },
          data: {
            name: input.name
          },
          include: tenantSlugInclude
        });

        return toDashboardRecord(dashboard);
      } catch {
        return null;
      }
    },
    async remove(input: {
      tenantId: string;
      dashboardId: string;
    }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      try {
        const dashboard = await prisma.dashboard.delete({
          where: {
            id: input.dashboardId,
            tenantId: tenant.id
          }
        });

        return {
          deletedDashboardId: dashboard.id
        };
      } catch {
        return null;
      }
    }
  };
}
