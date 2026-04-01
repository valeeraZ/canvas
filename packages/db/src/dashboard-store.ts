import type { DashboardRecord } from "../../../packages/contracts/src/dashboards.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { resolveTenantBySlug, tenantSlugInclude } from "./tenant-slug.js";

type PersistedDashboard = {
  id: string;
  tenantId: string;
  name: string;
  workbookId: string | null;
  tenant?: {
    slug: string;
  } | null;
};

export function toDashboardRecord(input: PersistedDashboard): DashboardRecord {
  return {
    id: input.id,
    tenantId: input.tenant?.slug ?? input.tenantId,
    name: input.name,
    workbookId: input.workbookId
  };
}

export function createDashboardStore(prisma: PrismaClient) {
  return {
    async create(input: {
      tenantId: string;
      name: string;
      workbookId?: string;
    }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      const dashboard = await prisma.dashboard.create({
        data: {
          tenantId: tenant.id,
          name: input.name,
          workbookId: input.workbookId ?? null
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
    }
  };
}
