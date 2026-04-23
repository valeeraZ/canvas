import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  createCachedAuthorizationResolver,
  createMemoryExpiringStore,
  type AccessibleApp,
  type AuthorizationContext,
  type AuthorizationResolver,
  type ExpiringStore
} from "../../../../packages/auth/src/index.js";
import type { DbClient } from "../../../../packages/db/src/client.js";
import { attachAuthContext, authModule } from "../modules/auth/app";
import {
  createDatasetsService,
  datasetsModule,
  type DatasetsService
} from "../modules/datasets/app";
import {
  createDashboardsService,
  dashboardsModule,
  type DashboardsService
} from "../modules/dashboards/app";
import { sessionModule } from "../modules/session/app";
import {
  createWorkbooksService,
  type WorkbooksService,
  workbooksModule
} from "../modules/workbooks/app";
import {
  createCanvasSessionStore,
  DEFAULT_SESSION_TTL_SECONDS,
  type CanvasSessionStore
} from "../modules/session/session-store";

export type CreateApiAppOptions = {
  authBaseUrl: string;
  prettyLogs?: boolean;
  mockContext?: AuthorizationContext;
  mockAccessibleApps?: AccessibleApp[];
  db?: DbClient;
  tenantId?: string;
  authCacheStore?: ExpiringStore;
  sessionBackingStore?: ExpiringStore;
  authorizationResolver?: AuthorizationResolver;
  sessionStore?: CanvasSessionStore;
  sessionTtlSeconds?: number;
  datasets?: DatasetsService;
  workbooks?: WorkbooksService;
  dashboards?: DashboardsService;
};

const PUBLIC_ERROR_MESSAGE = "Request failed";

function createLoggerOptions(prettyLogs: boolean) {
  return {
    level: process.env.LOG_LEVEL ?? "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "request.headers.authorization",
        "request.headers.cookie",
        "headers.authorization",
        "headers.cookie"
      ],
      censor: "[redacted]"
    },
    ...(prettyLogs
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname"
            }
          }
        }
      : {})
  } as const;
}

export function createApiApp(options: CreateApiAppOptions) {
  const app = Fastify({
    genReqId() {
      return randomUUID();
    },
    logger: createLoggerOptions(options.prettyLogs ?? false)
  });
  const authCacheStore = options.authCacheStore ?? createMemoryExpiringStore();
  const sessionBackingStore =
    options.sessionBackingStore ?? createMemoryExpiringStore();
  const sessionTtlSeconds = options.sessionTtlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
  const authorizationResolver =
    options.authorizationResolver ??
    createCachedAuthorizationResolver({
      authBaseUrl: options.authBaseUrl,
      defaultMockContext: options.mockContext,
      defaultMockAccessibleApps: options.mockAccessibleApps,
      cache: authCacheStore,
      ttlSeconds: sessionTtlSeconds
    });
  const sessionStore =
    options.sessionStore ??
    createCanvasSessionStore({
      backingStore: sessionBackingStore,
      ttlSeconds: sessionTtlSeconds
    });

  void app.register(cookie);

  void app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Canvas API",
        description:
          "Fastify runtime for the Canvas portal and embed viewer. Send Authorization: Bearer <amtoken> and let Canvas manage the active app in the canvas_session cookie.",
        version: "0.1.0"
      },
      tags: [
        {
          name: "system",
          description: "Service health and machine-readable documentation endpoints."
        },
        {
          name: "session",
          description: "Canvas server session bootstrap and amtoken exchange endpoints."
        },
        {
          name: "auth",
          description: "App-scoped identity and active app selection endpoints."
        },
        {
          name: "datasets",
          description: "Dataset ingestion and inspection endpoints scoped to the selected app."
        },
        {
          name: "workbooks",
          description: "Workbook management endpoints scoped to the selected app."
        },
        {
          name: "dashboards",
          description: "Dashboard management, visibility, and per-user selection endpoints."
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      },
      servers: [
        {
          url: "/",
          description: "Current origin"
        }
      ]
    }
  });

  void app.register(swaggerUi, {
    routePrefix: "/docs"
  });

  app.get("/health", {
    schema: {
      tags: ["system"],
      summary: "Health check",
      description: "Simple readiness endpoint for local development, probes, and smoke checks.",
      response: {
        200: {
          type: "object",
          properties: {
            status: {
              type: "string"
            }
          },
          required: ["status"]
        }
      }
    }
  }, async () => {
    return {
      status: "ok" as const
    };
  });

  app.get("/openapi.json", {
    schema: {
      tags: ["system"],
      summary: "OpenAPI document",
      description: "Machine-readable OpenAPI document that powers the Swagger UI at /docs.",
      hide: true,
      response: {
        200: {
          type: "object",
          additionalProperties: true
        }
      }
    }
  }, async () => app.swagger());

  app.setErrorHandler((error, request, reply) => {
    request.log.error(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        tenantId: request.tenantContext?.tenantId,
        externalUserId: request.tenantContext?.externalUserId,
        err: error
      },
      "Canvas request failed"
    );

    reply.header("x-request-id", request.id);
    reply.status(500).send({
      message: PUBLIC_ERROR_MESSAGE,
      requestId: request.id
    });
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    return payload;
  });

  void attachAuthContext(app, {
    authBaseUrl: options.authBaseUrl,
    mockContext: options.mockContext,
    mockAccessibleApps: options.mockAccessibleApps,
    authorizationResolver,
    sessionStore
  });
  void app.register(authModule, {
    authBaseUrl: options.authBaseUrl,
    mockContext: options.mockContext,
    mockAccessibleApps: options.mockAccessibleApps,
    authorizationResolver,
    sessionStore
  });
  void app.register(sessionModule, {
    ...options,
    authorizationResolver,
    sessionStore,
    sessionTtlSeconds
  });

  const datasets =
    options.datasets ??
    (options.db
      ? createDatasetsService({
          db: options.db,
          tenantId: options.tenantId ?? "tenant_demo"
        })
      : null);

  if (datasets) {
    void app.register(datasetsModule, { datasets });
  }

  const workbooks =
    options.workbooks ??
    (options.db
      ? createWorkbooksService({
          db: options.db,
          tenantId: options.tenantId ?? "tenant_demo"
        })
      : null);

  if (workbooks) {
    void app.register(workbooksModule, { workbooks });
  }

  const dashboards =
    options.dashboards ??
    (options.db
      ? createDashboardsService({
          db: options.db
        })
      : null);

  if (dashboards) {
    void app.register(dashboardsModule, { dashboards });
  }

  return app;
}
