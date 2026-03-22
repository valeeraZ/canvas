import type { FastifyPluginAsync } from "fastify";
import { createDashboardStore } from "../../../../../packages/db/src";
import type { DashboardRecord } from "../../../../../packages/contracts/src/dashboards";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client";

export type DashboardsService = {
  listDashboards: () => Promise<DashboardRecord[]>;
  getDashboard: (dashboardId: string) => Promise<DashboardRecord | null>;
  createDashboard: (input: {
    name: string;
    workbookId?: string;
  }) => Promise<DashboardRecord>;
};

export type DashboardsModuleOptions = {
  dashboards: DashboardsService;
};

export function createDashboardsService(input: {
  db: PrismaClient;
  tenantId: string;
}): DashboardsService {
  const dashboards = createDashboardStore(input.db);

  return {
    listDashboards() {
      return dashboards.listByTenant(input.tenantId);
    },
    getDashboard(dashboardId: string) {
      return dashboards.findByTenantAndId(input.tenantId, dashboardId);
    },
    createDashboard(payload: { name: string; workbookId?: string }) {
      return dashboards.create({
        tenantId: input.tenantId,
        name: payload.name,
        workbookId: payload.workbookId
      });
    }
  };
}

export const dashboardsModule: FastifyPluginAsync<DashboardsModuleOptions> = async (
  app,
  options
) => {
  app.get("/dashboards", async () => {
    return options.dashboards.listDashboards();
  });

  app.get<{
    Params: {
      dashboardId: string;
    };
  }>("/dashboards/:dashboardId", async (request, reply) => {
    const dashboard = await options.dashboards.getDashboard(
      request.params.dashboardId
    );

    if (!dashboard) {
      reply.status(404);
      return {
        message: "Dashboard not found"
      };
    }

    return dashboard;
  });

  app.post<{
    Body: {
      name?: string;
      workbookId?: string;
    };
  }>("/dashboards", async (request) => {
    return options.dashboards.createDashboard({
      name: request.body?.name ?? "Untitled Dashboard",
      workbookId: request.body?.workbookId
    });
  });
};
