import {
  createMemoryExpiringStore,
  createRedisExpiringStore,
  type AuthorizationContext
} from "../../../packages/auth/src/index.js";
import { createDbClient, type DbClient } from "../../../packages/db/src/client.js";
import {
  createImportJobQueue,
  createQueueClient
} from "../../../packages/queue/src/index.js";
import {
  createObjectReader,
  createS3MultipartUploadService,
  createS3ObjectReader,
  readStorageConfig,
  type StorageClientConfig
} from "../../../packages/storage/src/index.js";
import { createApiApp } from "./api/app";
import { createDatasetsService } from "./modules/datasets/app";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3001;
const DEFAULT_AUTH_BASE_URL = "http://localhost:8000";
const DEFAULT_APP_NAME = "tenant_demo";
const DEFAULT_DATABASE_URL = "postgres://canvas:canvas@localhost:5432/canvas";
const DEFAULT_MOCK_CONTEXT: AuthorizationContext = {
  displayName: "Local Dev",
  employeeId: "dev-1",
  roles: ["ADMIN"]
};

export type BackendRuntimeConfig = {
  runtimeMode: "api" | "worker";
  host: string;
  port: number;
  authBaseUrl: string;
  appName: string;
  databaseUrl?: string;
  redisUrl?: string;
  storage?: StorageClientConfig;
  prettyLogs: boolean;
  mockContext?: AuthorizationContext;
};

export type BackendRuntime = {
  app: ReturnType<typeof createApiApp>;
  db?: DbClient;
  cache?: {
    disconnect(): Promise<void>;
  };
  queue?: {
    connect(): Promise<void>;
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
  const useMockAuth = parseBooleanFlag(source.CANVAS_USE_MOCK_AUTH, false);
  const storage = source.S3_BUCKET ? readStorageConfig(source) : undefined;

  return {
    runtimeMode:
      source.CANVAS_RUNTIME_MODE === "worker" ? "worker" : "api",
    host: source.HOST ?? DEFAULT_HOST,
    port: parsePort(source.PORT),
    authBaseUrl: source.AUTH_BASE_URL ?? DEFAULT_AUTH_BASE_URL,
    appName: source.CANVAS_APP_NAME ?? DEFAULT_APP_NAME,
    databaseUrl: source.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    redisUrl: source.REDIS_URL,
    storage,
    prettyLogs: parseBooleanFlag(source.CANVAS_PRETTY_LOGS, false),
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
  const queueClient = config.redisUrl
    ? createQueueClient({
        redisUrl: config.redisUrl
      })
    : undefined;
  const objectReader = config.storage
    ? createObjectReader(createS3ObjectReader(config.storage))
    : undefined;
  const datasets =
    db && config.storage
      ? createDatasetsService({
          db,
          tenantId: config.appName,
          importQueue: queueClient
            ? createImportJobQueue({
                redis: queueClient
              })
            : undefined,
          multipartUploads: createS3MultipartUploadService(config.storage),
          storageBucket: config.storage.bucket,
          cache,
          objectReader
        })
      : undefined;

  const app = createApiApp({
    authBaseUrl: config.authBaseUrl,
    mockContext: config.mockContext,
    db,
    datasets,
    tenantId: config.appName,
    prettyLogs: config.prettyLogs,
    authCacheStore: cache,
    sessionBackingStore: cache
  });

  return {
    app,
    db,
    cache: "disconnect" in cache ? cache : undefined,
    queue: queueClient,
    config
  };
}

export async function startBackendRuntime(
  config: BackendRuntimeConfig = createBackendRuntimeConfig(process.env)
) {
  const runtime = createBackendRuntime(config);

  await runtime.db?.$connect();
  await runtime.queue?.connect();
  await runtime.app.listen({
    host: runtime.config.host,
    port: runtime.config.port
  });

  return runtime;
}
