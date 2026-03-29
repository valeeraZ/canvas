import type { FastifyPluginAsync } from "fastify";
import {
  createDashboardStore,
  createDashboardVisibilityStore,
  createPrincipalAppPreferenceStore,
  createPrincipalStore
} from "../../../../../packages/db/src/index.js";
import type { DashboardRecord } from "../../../../../packages/contracts/src/dashboards.js";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client.js";
import { shareDashboard } from "./routes/share-dashboard";
import {
  getSelectedDashboard,
  setSelectedDashboard
} from "./routes/set-selected-dashboard";
import type { DashboardVisibilitySubjectType } from "./routes/share-dashboard";
import {
  dashboardSchema,
  dashboardExportPackageSchema,
  messageResponseSchema,
  selectedDashboardSchema
} from "../../api/schema";
import type { DashboardExportPackage } from "../../../../../packages/contracts/src/dashboard-portability.js";

export type DashboardsService = {
  listDashboards: (tenantId: string) => Promise<DashboardRecord[]>;
  listVisibleDashboards: (input: {
    tenantId: string;
    externalUserId: string;
    roles: string[];
    groups: string[];
  }) => Promise<DashboardRecord[]>;
  getDashboard: (dashboardId: string, tenantId: string) => Promise<DashboardRecord | null>;
  createDashboard: (input: {
    tenantId: string;
    name: string;
    workbookId?: string;
  }) => Promise<DashboardRecord>;
  shareDashboard: (input: {
    tenantId: string;
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
  getDashboardShare: (input: {
    tenantId: string;
    dashboardId: string;
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
  exportDashboard: (input: {
    tenantId: string;
    dashboardId: string;
  }) => Promise<DashboardExportPackage | null>;
  importDashboard: (input: {
    tenantId: string;
    package: DashboardExportPackage;
  }) => Promise<DashboardRecord>;
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
}): DashboardsService {
  const dashboards = createDashboardStore(input.db);
  const visibility = createDashboardVisibilityStore(input.db);
  const principals = createPrincipalStore(input.db);
  const preferences = createPrincipalAppPreferenceStore(input.db);

  return {
    listDashboards(tenantId: string) {
      return dashboards.listByTenant(tenantId);
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
    getDashboard(dashboardId: string, tenantId: string) {
      return dashboards.findByTenantAndId(tenantId, dashboardId);
    },
    createDashboard(payload: { tenantId: string; name: string; workbookId?: string }) {
      return dashboards.create({
        tenantId: payload.tenantId,
        name: payload.name,
        workbookId: payload.workbookId
      });
    },
    shareDashboard(payload) {
      return shareDashboard({
        appId: payload.tenantId,
        dashboardId: payload.dashboardId,
        subjects: payload.subjects,
        replaceRules: visibility.replaceRules
      });
    },
    async getDashboardShare(payload) {
      const rules = await visibility.listByDashboard({
        appId: payload.tenantId,
        dashboardId: payload.dashboardId
      });

      return {
        dashboardId: payload.dashboardId,
        rules,
        subjects: rules.map((rule) => ({
          type: rule.subjectType,
          id: rule.subjectId
        }))
      };
    },
    async exportDashboard(payload) {
      const dashboard = await dashboards.findByTenantAndId(
        payload.tenantId,
        payload.dashboardId
      );

      if (!dashboard) {
        return null;
      }

      const share = await visibility.listByDashboard({
        appId: payload.tenantId,
        dashboardId: payload.dashboardId
      });

      return {
        version: 1,
        dashboard: {
          name: dashboard.name,
          workbookId: dashboard.workbookId
        },
        shareSubjects: share.map((rule) => ({
          type: rule.subjectType,
          id: rule.subjectId
        }))
      };
    },
    async importDashboard(payload) {
      const dashboard = await dashboards.create({
        tenantId: payload.tenantId,
        name: payload.package.dashboard.name,
        workbookId: payload.package.dashboard.workbookId ?? undefined
      });

      await visibility.replaceRules({
        appId: payload.tenantId,
        dashboardId: dashboard.id,
        rules: payload.package.shareSubjects.map((subject) => ({
          dashboardId: dashboard.id,
          appId: payload.tenantId,
          subjectType: subject.type,
          subjectId: subject.id
        }))
      });

      return dashboard;
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
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns dashboard records owned by the currently selected app.",
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

    return options.dashboards.listDashboards(request.tenantContext.tenantId);
  });

  app.get("/dashboards/visible", {
    schema: {
      tags: ["dashboards"],
      summary: "List dashboards visible to the current principal",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns dashboards in the selected app that are shared with the current principal by user, role, or group.",
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
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns one dashboard record for the selected app.",
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
            description: "Dashboard identifier inside the active app.",
            type: "string"
          }
        }
      },
      response: {
        200: dashboardSchema,
        401: messageResponseSchema,
        404: messageResponseSchema
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

    const dashboard = await options.dashboards.getDashboard(
      request.params.dashboardId,
      request.tenantContext.tenantId
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
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Replaces explicit visibility subjects for the given dashboard in the selected app.",
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
            description: "Dashboard identifier inside the active app.",
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
                  description: "Visibility subject type. Expected values are user, group, or role.",
                  type: "string"
                },
                id: {
                  description: "Opaque subject identifier from Canvas or the external auth system.",
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

    return options.dashboards.shareDashboard({
      tenantId: request.tenantContext.tenantId,
      dashboardId: request.params.dashboardId,
      subjects: request.body?.subjects ?? []
    });
  });

  app.get<{
    Params: {
      dashboardId: string;
    };
  }>("/dashboards/:dashboardId/share", {
    schema: {
      tags: ["dashboards"],
      summary: "Read dashboard visibility subjects",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns explicit visibility subjects for the given dashboard in the selected app.",
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
            description: "Dashboard identifier inside the active app.",
            type: "string"
          }
        }
      },
      response: {
        200: {
          type: "object",
          additionalProperties: true
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

    return options.dashboards.getDashboardShare({
      tenantId: request.tenantContext.tenantId,
      dashboardId: request.params.dashboardId
    });
  });

  app.get<{
    Params: {
      dashboardId: string;
    };
  }>("/dashboards/:dashboardId/export", {
    schema: {
      tags: ["dashboards"],
      summary: "Export a portable dashboard package",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns a lightweight dashboard package with dashboard metadata and explicit share subjects.",
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
            description: "Dashboard identifier inside the active app.",
            type: "string"
          }
        }
      },
      response: {
        200: dashboardExportPackageSchema,
        401: messageResponseSchema,
        404: messageResponseSchema
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

    const exported = await options.dashboards.exportDashboard({
      tenantId: request.tenantContext.tenantId,
      dashboardId: request.params.dashboardId
    });

    if (!exported) {
      reply.status(404);
      return {
        message: "Dashboard not found"
      };
    }

    return exported;
  });

  app.get("/dashboards/selected-dashboard", {
    schema: {
      tags: ["dashboards"],
      summary: "Get the selected dashboard for the current principal",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Returns the per-user dashboard preference for the selected app.",
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
    Body: DashboardExportPackage;
  }>("/dashboards/import", {
    schema: {
      tags: ["dashboards"],
      summary: "Import a portable dashboard package",
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Creates a new dashboard in the selected app and restores explicit share subjects from the package.",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: dashboardExportPackageSchema,
      response: {
        200: dashboardSchema,
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

    return options.dashboards.importDashboard({
      tenantId: request.tenantContext.tenantId,
      package: request.body
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
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Stores the per-user dashboard preference for the selected app.",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: {
        type: "object",
        properties: {
          dashboardId: {
            description: "Dashboard identifier to save as the current preference, or null to clear it.",
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
      description:
        "Requires Authorization: Bearer <amtoken> and a valid canvas_session cookie. Creates a dashboard record inside the currently selected app.",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: {
        type: "object",
        properties: {
          name: {
            description: "Dashboard display name.",
            type: "string"
          },
          workbookId: {
            description: "Optional workbook identifier to attach to the dashboard.",
            type: "string"
          }
        }
      },
      response: {
        200: dashboardSchema,
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

    return options.dashboards.createDashboard({
      tenantId: request.tenantContext.tenantId,
      name: request.body?.name ?? "Untitled Dashboard",
      workbookId: request.body?.workbookId
    });
  });
};
