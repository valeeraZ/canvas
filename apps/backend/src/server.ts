import {
  createMemoryExpiringStore,
  createRedisExpiringStore,
  type AuthorizationContext
} from "../../../packages/auth/src";
import { createDbClient } from "../../../packages/db/src/client";
import type { PrismaClient } from "../../../packages/db/src/generated/prisma/client";
import { createApiApp } from "./api/app";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3001;
const DEFAULT_AUTH_BASE_URL = "http://auth.local";
const DEFAULT_APP_NAME = "tenant_demo";
const DEFAULT_DATABASE_URL = "postgres://canvas:canvas@localhost:5432/canvas";
const DEFAULT_MOCK_CONTEXT: AuthorizationContext = {
  displayName: "Local Dev",
  employeeId: "dev-1",
  roles: ["ADMIN"]
};

export type BackendRuntimeConfig = {
  host: string;
  port: number;
  authBaseUrl: string;
  appName: string;
  databaseUrl?: string;
  redisUrl?: string;
  mockContext?: AuthorizationContext;
};

export type BackendRuntime = {
  app: ReturnType<typeof createApiApp>;
  db?: PrismaClient;
  cache?: {
    disconnect(): Promise<void>;
  };
  config: BackendRuntimeConfig;
};

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(value, 10);
  return Number.isFinite(port) ? port : DEFAULT_PORT;
}

function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return !["0", "false", "off", "no"].includes(value.toLowerCase());
}

function parseRoles(value: string | undefined): string[] {
  if (!value) {
    return [...DEFAULT_MOCK_CONTEXT.roles];
  }

  return value
    .split(",")
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}

export function createBackendRuntimeConfig(
  source: Record<string, string | undefined>
): BackendRuntimeConfig {
  const useMockAuth = parseBooleanFlag(source.CANVAS_USE_MOCK_AUTH, true);

  return {
    host: source.HOST ?? DEFAULT_HOST,
    port: parsePort(source.PORT),
    authBaseUrl: source.AUTH_BASE_URL ?? DEFAULT_AUTH_BASE_URL,
    appName: source.CANVAS_APP_NAME ?? DEFAULT_APP_NAME,
    databaseUrl: source.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    redisUrl: source.REDIS_URL,
    mockContext: useMockAuth
      ? {
          displayName:
            source.CANVAS_MOCK_DISPLAY_NAME ?? DEFAULT_MOCK_CONTEXT.displayName,
          employeeId:
            source.CANVAS_MOCK_EMPLOYEE_ID ?? DEFAULT_MOCK_CONTEXT.employeeId,
          roles: parseRoles(source.CANVAS_MOCK_ROLES)
        }
      : undefined
  };
}

export function createBackendRuntime(
  config: BackendRuntimeConfig
): BackendRuntime {
  const db = config.databaseUrl
    ? createDbClient({
        connectionString: config.databaseUrl
      })
    : undefined;
  const cache = config.redisUrl
    ? createRedisExpiringStore(config.redisUrl)
    : createMemoryExpiringStore();

  const app = createApiApp({
    authBaseUrl: config.authBaseUrl,
    mockContext: config.mockContext,
    db,
    tenantId: config.appName,
    authCacheStore: cache,
    sessionBackingStore: cache
  });

  return {
    app,
    db,
    cache: "disconnect" in cache ? cache : undefined,
    config
  };
}

export async function startBackendRuntime(
  config: BackendRuntimeConfig = createBackendRuntimeConfig(process.env)
) {
  const runtime = createBackendRuntime(config);

  await runtime.db?.$connect();
  await runtime.app.listen({
    host: runtime.config.host,
    port: runtime.config.port
  });

  return runtime;
}
