import type { FastifyPluginAsync } from "fastify";
import { createWorkbookStore } from "../../../../../packages/db/src";
import type { PrismaClient } from "../../../../../packages/db/src/generated/prisma/client";
import type { WorkbookRecord } from "../../../../../packages/contracts/src/workbooks";
import { messageResponseSchema, workbookSchema } from "../../api/schema";

export type WorkbooksService = {
  listWorkbooks: (tenantId: string) => Promise<WorkbookRecord[]>;
  getWorkbook: (workbookId: string, tenantId: string) => Promise<WorkbookRecord | null>;
  createWorkbook: (input: { name: string; tenantId: string }) => Promise<WorkbookRecord>;
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
    listWorkbooks(tenantId: string) {
      return workbooks.listByTenant(tenantId);
    },
    getWorkbook(workbookId: string, tenantId: string) {
      return workbooks.findByTenantAndId(tenantId, workbookId);
    },
    createWorkbook(payload: { name: string; tenantId: string }) {
      return workbooks.create({
        tenantId: payload.tenantId,
        name: payload.name
      });
    }
  };
}

export const workbooksModule: FastifyPluginAsync<WorkbooksModuleOptions> = async (
  app,
  options
) => {
  app.get("/workbooks", {
    schema: {
      tags: ["workbooks"],
      summary: "List workbooks for the current app",
      security: [
        {
          bearerAuth: []
        }
      ],
      response: {
        200: {
          type: "array",
          items: workbookSchema
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

    return options.workbooks.listWorkbooks(request.tenantContext.tenantId);
  });

  app.get<{
    Params: {
      workbookId: string;
    };
  }>("/workbooks/:workbookId", {
    schema: {
      tags: ["workbooks"],
      summary: "Get one workbook",
      security: [
        {
          bearerAuth: []
        }
      ],
      params: {
        type: "object",
        required: ["workbookId"],
        properties: {
          workbookId: {
            type: "string"
          }
        }
      },
      response: {
        200: workbookSchema,
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

    const workbook = await options.workbooks.getWorkbook(
      request.params.workbookId,
      request.tenantContext.tenantId
    );

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
  }>("/workbooks", {
    schema: {
      tags: ["workbooks"],
      summary: "Create a workbook",
      security: [
        {
          bearerAuth: []
        }
      ],
      body: {
        type: "object",
        properties: {
          name: {
            type: "string"
          }
        }
      },
      response: {
        200: workbookSchema,
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

    return options.workbooks.createWorkbook({
      name: request.body?.name ?? "Untitled Workbook",
      tenantId: request.tenantContext.tenantId
    });
  });
};
