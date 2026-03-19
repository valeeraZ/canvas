import Fastify from "fastify";
import type { AuthorizationContext } from "../../../../packages/auth/src/authorization-api";
import type { PrismaClient } from "../../../../packages/db/src/generated/prisma/client";
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

export type CreateApiAppOptions = {
  authBaseUrl: string;
  mockContext?: AuthorizationContext;
  db?: PrismaClient;
  tenantId?: string;
  datasets?: DatasetsService;
  workbooks?: WorkbooksService;
  dashboards?: DashboardsService;
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
          db: options.db,
          tenantId: options.tenantId ?? "tenant_demo"
        })
      : null);

  if (dashboards) {
    void app.register(dashboardsModule, { dashboards });
  }

  return app;
}
