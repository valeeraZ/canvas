import type { DashboardRecord } from "../../../packages/contracts/src/dashboards.js";
import type { PrismaClient } from "./generated/prisma/client.js";

type PersistedDashboard = {
  id: string;
  tenantId: string;
  name: string;
  workbookId: string | null;
};

export function toDashboardRecord(input: PersistedDashboard): DashboardRecord {
  return {
    id: input.id,
    tenantId: input.tenantId,
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
      const dashboard = await prisma.dashboard.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          workbookId: input.workbookId ?? null
        }
      });

      return toDashboardRecord(dashboard);
    },
    async listByTenant(tenantId: string) {
      const dashboards = await prisma.dashboard.findMany({
        where: { tenantId },
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
          tenantId
        }
      });

      return dashboard ? toDashboardRecord(dashboard) : null;
    }
  };
}
