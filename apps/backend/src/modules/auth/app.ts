import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type {
  AccessibleApp,
  AuthorizationContext,
  AuthorizationResolver
} from "../../../../../packages/auth/src/index.js";
import { selectApp } from "./routes/select-app";
import {
  accessibleAppsResponseSchema,
  messageResponseSchema,
  selectAppResponseSchema,
  tenantContextSchema
} from "../../api/schema";
import type { CanvasSessionStore } from "../session/session-store";
import {
  readCanvasSessionId,
  writeCanvasSessionCookie
} from "../session/session-store";

declare module "fastify" {
  interface FastifyRequest {
    tenantContext?: {
      tenantId: string;
      externalUserId: string;
      roles: string[];
      groups: string[];
    };
  }
}

export type AuthModuleOptions = {
  authBaseUrl: string;
  mockContext?: AuthorizationContext;
  mockAccessibleApps?: AccessibleApp[];
  authorizationResolver: AuthorizationResolver;
  sessionStore: CanvasSessionStore;
};

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

export async function attachAuthContext(
  app: FastifyInstance,
  options: AuthModuleOptions
) {
  app.decorateRequest("tenantContext", null);

  app.addHook("preHandler", async (request) => {
    const token = readBearerToken(request.headers.authorization);
    const sessionId = readCanvasSessionId(request);

    if (!token || !sessionId) {
      return;
    }

    const session = await options.sessionStore.get(sessionId);

    if (!session) {
      return;
    }

    const claims = await options.authorizationResolver.resolve({
      amtoken: token,
      appName: session.selectedApp,
      authBaseUrl: options.authBaseUrl,
      mockContext: options.mockContext,
      mockAccessibleApps: options.mockAccessibleApps
    });

    request.tenantContext = {
      tenantId: claims.appName,
      externalUserId: claims.employeeId,
      roles: claims.roles,
      groups: [
        ...claims.groups,
        ...readGroups(request.headers["x-canvas-groups"] as string | undefined)
      ]
    };
  });
}

export const authModule: FastifyPluginAsync<AuthModuleOptions> = async (
  app,
  options
) => {
  app.get("/auth/apps", {
    schema: {
      tags: ["auth"],
      summary: "List all apps accessible to the current principal",
      description:
        "Requires Authorization: Bearer <amtoken>. Returns the app inventory used by the Canvas Portal landing page before the user drills into app-scoped dashboard and workbook management.",
      security: [
        {
          bearerAuth: []
        }
      ],
      response: {
        200: accessibleAppsResponseSchema,
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    const token = readBearerToken(request.headers.authorization);

    if (!token) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    const [principal, accessibleApps] = await Promise.all([
      options.authorizationResolver.getPrincipal?.({
        amtoken: token,
        authBaseUrl: options.authBaseUrl,
        mockContext: options.mockContext
      }),
      options.authorizationResolver.listAccessibleApps?.({
        amtoken: token,
        authBaseUrl: options.authBaseUrl,
        mockContext: options.mockContext,
        mockAccessibleApps: options.mockAccessibleApps
      })
    ]);

    return {
      principal: principal ?? {
        displayName: options.mockContext?.displayName ?? "Unknown user",
        employeeId: options.mockContext?.employeeId ?? "unknown"
      },
      apps: accessibleApps ?? []
    };
  });

  app.get("/auth/me", {
    schema: {
      tags: ["auth"],
      summary: "Read the current app-scoped principal context",
      description:
        "Requires Authorization: Bearer <amtoken> plus a valid canvas_session cookie. Returns the current principal resolved for the active app stored in the Canvas server session.",
      security: [
        {
          bearerAuth: []
        }
      ],
      response: {
        200: tenantContextSchema,
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

    return request.tenantContext;
  });

  app.post<{
    Body: {
      appName?: string;
    };
  }>("/auth/select-app", {
    schema: {
      tags: ["auth"],
      summary: "Switch the current app in the Canvas server session",
      description:
        "Requires Authorization: Bearer <amtoken> and updates the Canvas-managed canvas_session cookie so later requests resolve identity and permissions for the selected app.",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: {
        type: "object",
        required: ["appName"],
        properties: {
          appName: {
            description: "App identifier to store as the active Canvas app.",
            type: "string"
          }
        }
      },
      response: {
        200: selectAppResponseSchema,
        400: messageResponseSchema,
        401: messageResponseSchema
      }
    }
  }, async (request, reply) => {
    const token = readBearerToken(request.headers.authorization);

    if (!token) {
      reply.status(401);
      return {
        message: "Missing bearer token"
      };
    }

    if (!request.body?.appName) {
      reply.status(400);
      return {
        message: "appName is required"
      };
    }

    const resolved = await options.authorizationResolver.resolve({
      amtoken: token,
      appName: request.body.appName,
      authBaseUrl: options.authBaseUrl,
      mockContext: options.mockContext,
      mockAccessibleApps: options.mockAccessibleApps
    });

    const existingSessionId = readCanvasSessionId(request);
    const session = existingSessionId
      ? await options.sessionStore.set(existingSessionId, {
          selectedApp: resolved.appName,
          externalUserId: resolved.employeeId
        })
      : await options.sessionStore.create({
          selectedApp: resolved.appName,
          externalUserId: resolved.employeeId
        });

    writeCanvasSessionCookie(reply, session.sessionId);

    return selectApp({
      appName: resolved.appName,
      roles: resolved.roles
    });
  });
};
