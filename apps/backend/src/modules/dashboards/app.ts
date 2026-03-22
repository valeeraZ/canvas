import type { FastifyPluginAsync } from "fastify";
import { decodeCanvasAccessToken } from "../../../../../packages/auth/src/canvas-token-decode";
import {
  createDashboardStore,
  createDashboardVisibilityStore,
  createPrincipalStore
} from "../../../../../packages/db/src";
import type { DashboardRecord } from "../../../../../packages/contracts/src/dashboards";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client";

export type DashboardsService = {
  listDashboards: () => Promise<DashboardRecord[]>;
  listVisibleDashboards: (input: {
    tenantId: string;
    externalUserId: string;
    roles: string[];
    groups: string[];
  }) => Promise<DashboardRecord[]>;
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
  const visibility = createDashboardVisibilityStore(input.db);
  const principals = createPrincipalStore(input.db);

  return {
    listDashboards() {
      return dashboards.listByTenant(input.tenantId);
    },
    async listVisibleDashboards(viewer) {
      if (viewer.tenantId !== input.tenantId) {
        return [];
      }

      const principal = await principals.findByExternalUserId(
        viewer.externalUserId
      );
      const subjects: Array<{
        subjectType: "user" | "group" | "role";
        subjectId: string;
      }> = [
        ...viewer.roles.map((role) => ({ subjectType: "role" as const, subjectId: role })),
        ...viewer.groups.map((group) => ({
          subjectType: "group" as const,
          subjectId: group
        }))
      ];

      if (principal?.id) {
        subjects.push({
          subjectType: "user",
          subjectId: principal.id
        });
      }

      const matchedRules = await visibility.listByAppAndSubjects({
        appId: input.tenantId,
        subjects
      });
      const visibleIds = new Set(matchedRules.map((rule) => rule.dashboardId));

      if (visibleIds.size === 0) {
        return [];
      }

      const scopedDashboards = await dashboards.listByTenant(input.tenantId);
      return scopedDashboards.filter((dashboard) => visibleIds.has(dashboard.id));
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
  function readBearerToken(header: string | undefined): string | null {
    if (!header?.startsWith("Bearer ")) {
      return null;
    }

    return header.slice("Bearer ".length).trim() || null;
  }

  function readGroups(header: string | undefined): string[] {
    if (!header) {
      return [];
    }

    return header
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  app.get("/dashboards", async () => {
    return options.dashboards.listDashboards();
  });

  app.get("/dashboards/visible", async (request, reply) => {
    const token = readBearerToken(request.headers.authorization);

    if (!token) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    const claims = decodeCanvasAccessToken(token);

    return options.dashboards.listVisibleDashboards({
      tenantId: claims.tenantId,
      externalUserId: claims.externalUserId,
      roles: claims.roles,
      groups: readGroups(request.headers["x-canvas-groups"] as string | undefined)
    });
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
