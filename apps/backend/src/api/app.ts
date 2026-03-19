import Fastify from "fastify";
import type { AuthorizationContext } from "../../../../packages/auth/src/authorization-api";
import type { PrismaClient } from "../../../../packages/db/src/generated/prisma/client";
import {
  createDatasetsService,
  datasetsModule,
  type DatasetsService
} from "../modules/datasets/app";
import { sessionModule } from "../modules/session/app";

export type CreateApiAppOptions = {
  authBaseUrl: string;
  mockContext?: AuthorizationContext;
  db?: PrismaClient;
  tenantId?: string;
  datasets?: DatasetsService;
};

export function createApiApp(options: CreateApiAppOptions) {
  const app = Fastify();

  app.get("/health", async () => {
    return {
      status: "ok" as const
    };
  });

  void app.register(sessionModule, options);

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

  return app;
}
