import type { FastifyPluginAsync } from "fastify";
import { createWorkbookStore } from "../../../../../packages/db/src";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client";
import type { WorkbookRecord } from "../../../../../packages/contracts/src/workbooks";

export type WorkbooksService = {
  listWorkbooks: () => Promise<WorkbookRecord[]>;
  getWorkbook: (workbookId: string) => Promise<WorkbookRecord | null>;
  createWorkbook: (input: { name: string }) => Promise<WorkbookRecord>;
};

export type WorkbooksModuleOptions = {
  workbooks: WorkbooksService;
};

export function createWorkbooksService(input: {
  db: PrismaClient;
  tenantId: string;
}): WorkbooksService {
  const workbooks = createWorkbookStore(input.db);

  return {
    listWorkbooks() {
      return workbooks.listByTenant(input.tenantId);
    },
    getWorkbook(workbookId: string) {
      return workbooks.findByTenantAndId(input.tenantId, workbookId);
    },
    createWorkbook(payload: { name: string }) {
      return workbooks.create({
        tenantId: input.tenantId,
        name: payload.name
      });
    }
  };
}

export const workbooksModule: FastifyPluginAsync<WorkbooksModuleOptions> = async (
  app,
  options
) => {
  app.get("/workbooks", async () => {
    return options.workbooks.listWorkbooks();
  });

  app.get<{
    Params: {
      workbookId: string;
    };
  }>("/workbooks/:workbookId", async (request, reply) => {
    const workbook = await options.workbooks.getWorkbook(request.params.workbookId);

    if (!workbook) {
      reply.status(404);
      return {
        message: "Workbook not found"
      };
    }

    return workbook;
  });

  app.post<{
    Body: {
      name?: string;
    };
  }>("/workbooks", async (request) => {
    return options.workbooks.createWorkbook({
      name: request.body?.name ?? "Untitled Workbook"
    });
  });
};
