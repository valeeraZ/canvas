import type { FastifyPluginAsync } from "fastify";
import {
  createDashboardStore,
  createDashboardVisibilityStore,
  createPrincipalAppPreferenceStore,
  createPrincipalStore
} from "../../../../../packages/db/src";
import type { DashboardRecord } from "../../../../../packages/contracts/src/dashboards";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client";
import { shareDashboard } from "./routes/share-dashboard";
import {
  getSelectedDashboard,
  setSelectedDashboard
} from "./routes/set-selected-dashboard";
import type { DashboardVisibilitySubjectType } from "./routes/share-dashboard";
import {
  dashboardSchema,
  messageResponseSchema,
  selectedDashboardSchema
} from "../../api/schema";

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
  shareDashboard: (input: {
    dashboardId: string;
    subjects: Array<{
      type: DashboardVisibilitySubjectType;
      id: string;
    }>;
  }) => Promise<{
    dashboardId: string;
    subjects: Array<{
      type: DashboardVisibilitySubjectType;
      id: string;
    }>;
    rules: Array<{
      id?: string;
      dashboardId: string;
      appId: string;
      subjectType: DashboardVisibilitySubjectType;
      subjectId: string;
    }>;
  }>;
  getSelectedDashboard: (input: {
    tenantId: string;
    externalUserId: string;
  }) => Promise<{
    dashboardId: string | null;
  }>;
  setSelectedDashboard: (input: {
    tenantId: string;
    externalUserId: string;
    dashboardId: string | null;
  }) => Promise<{
    dashboardId: string | null;
  }>;
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
  const preferences = createPrincipalAppPreferenceStore(input.db);

  return {
    listDashboards() {
      return dashboards.listByTenant(input.tenantId);
    },
    async listVisibleDashboards(viewer) {
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
        appId: viewer.tenantId,
        subjects
      });
      const visibleIds = new Set(matchedRules.map((rule) => rule.dashboardId));

      if (visibleIds.size === 0) {
        return [];
      }

      const scopedDashboards = await dashboards.listByTenant(viewer.tenantId);
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
    },
    shareDashboard(payload) {
      return shareDashboard({
        appId: input.tenantId,
        dashboardId: payload.dashboardId,
        subjects: payload.subjects,
        replaceRules: visibility.replaceRules
      });
    },
    getSelectedDashboard(viewer) {
      return getSelectedDashboard({
        appId: viewer.tenantId,
        externalUserId: viewer.externalUserId,
        findPrincipalByExternalUserId: principals.findByExternalUserId,
        getPreference: preferences.get
      });
    },
    setSelectedDashboard(viewer) {
      return setSelectedDashboard({
        appId: viewer.tenantId,
        externalUserId: viewer.externalUserId,
        dashboardId: viewer.dashboardId,
        upsertPrincipal: principals.upsert,
        setPreference: preferences.set
      });
    }
  };
}

export const dashboardsModule: FastifyPluginAsync<DashboardsModuleOptions> = async (
  app,
  options
) => {
  app.get("/dashboards", {
    schema: {
      tags: ["dashboards"],
      summary: "List dashboards for the current app",
      response: {
        200: {
          type: "array",
          items: dashboardSchema
        }
      }
    }
  }, async () => {
    return options.dashboards.listDashboards();
  });

  app.get("/dashboards/visible", {
    schema: {
      tags: ["dashboards"],
      summary: "List dashboards visible to the current principal",
      security: [
        {
          bearerAuth: []
        }
      ],
      response: {
        200: {
          type: "array",
          items: dashboardSchema
        },
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    return options.dashboards.listVisibleDashboards({
      tenantId: request.tenantContext.tenantId,
      externalUserId: request.tenantContext.externalUserId,
      roles: request.tenantContext.roles,
      groups: request.tenantContext.groups
    });
  });

  app.get<{
    Params: {
      dashboardId: string;
    };
  }>("/dashboards/:dashboardId", {
    schema: {
      tags: ["dashboards"],
      summary: "Get one dashboard",
      params: {
        type: "object",
        required: ["dashboardId"],
        properties: {
          dashboardId: {
            type: "string"
          }
        }
      },
      response: {
        200: dashboardSchema,
        404: messageResponseSchema
      }
    }
  }, async (request, reply) => {
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
    Params: {
      dashboardId: string;
    };
    Body: {
      subjects?: Array<{
        type: DashboardVisibilitySubjectType;
        id: string;
      }>;
    };
  }>("/dashboards/:dashboardId/share", {
    schema: {
      tags: ["dashboards"],
      summary: "Replace dashboard visibility subjects",
      security: [
        {
          bearerAuth: []
        }
      ],
      params: {
        type: "object",
        required: ["dashboardId"],
        properties: {
          dashboardId: {
            type: "string"
          }
        }
      },
      body: {
        type: "object",
        properties: {
          subjects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string"
                },
                id: {
                  type: "string"
                }
              },
              required: ["type", "id"]
            }
          }
        }
      },
      response: {
        200: {
          type: "object",
          additionalProperties: true
        }
      }
    }
  }, async (request) => {
    return options.dashboards.shareDashboard({
      dashboardId: request.params.dashboardId,
      subjects: request.body?.subjects ?? []
    });
  });

  app.get("/dashboards/selected-dashboard", {
    schema: {
      tags: ["dashboards"],
      summary: "Get the selected dashboard for the current principal",
      security: [
        {
          bearerAuth: []
        }
      ],
      response: {
        200: selectedDashboardSchema,
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    return options.dashboards.getSelectedDashboard({
      tenantId: request.tenantContext.tenantId,
      externalUserId: request.tenantContext.externalUserId
    });
  });

  app.post<{
    Body: {
      dashboardId?: string | null;
    };
  }>("/dashboards/selected-dashboard", {
    schema: {
      tags: ["dashboards"],
      summary: "Set the selected dashboard for the current principal",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: {
        type: "object",
        properties: {
          dashboardId: {
            type: ["string", "null"]
          }
        }
      },
      response: {
        200: selectedDashboardSchema,
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    if (!request.headers.authorization) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.tenantContext?.tenantId) {
      reply.status(401);
      return {
        message: "Missing tenant context"
      };
    }

    return options.dashboards.setSelectedDashboard({
      tenantId: request.tenantContext.tenantId,
      externalUserId: request.tenantContext.externalUserId,
      dashboardId: request.body?.dashboardId ?? null
    });
  });

  app.post<{
    Body: {
      name?: string;
      workbookId?: string;
    };
  }>("/dashboards", {
    schema: {
      tags: ["dashboards"],
      summary: "Create a dashboard",
      body: {
        type: "object",
        properties: {
          name: {
            type: "string"
          },
          workbookId: {
            type: "string"
          }
        }
      },
      response: {
        200: dashboardSchema
      }
    }
  }, async (request) => {
    return options.dashboards.createDashboard({
      name: request.body?.name ?? "Untitled Dashboard",
      workbookId: request.body?.workbookId
    });
  });
};
