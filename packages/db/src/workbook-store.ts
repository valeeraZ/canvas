import type { WorkbookRecord } from "../../../packages/contracts/src/workbooks.js";
import type { PrismaClient } from "./generated/prisma/client.js";

type PersistedWorkbook = {
  id: string;
  tenantId: string;
  name: string;
};

export function toWorkbookRecord(input: PersistedWorkbook): WorkbookRecord {
  return {
    id: input.id,
    tenantId: input.tenantId,
    name: input.name
  };
}

export function createWorkbookStore(prisma: PrismaClient) {
  return {
    async create(input: { tenantId: string; name: string }) {
      const workbook = await prisma.workbook.create({
        data: {
          tenantId: input.tenantId,
          name: input.name
        }
      });

      return toWorkbookRecord(workbook);
    },
    async listByTenant(tenantId: string) {
      const workbooks = await prisma.workbook.findMany({
        where: { tenantId },
        orderBy: {
          name: "asc"
        }
      });

      return workbooks.map(toWorkbookRecord);
    },
    async findByTenantAndId(tenantId: string, workbookId: string) {
      const workbook = await prisma.workbook.findFirst({
        where: {
          id: workbookId,
          tenantId
        }
      });

      return workbook ? toWorkbookRecord(workbook) : null;
    }
  };
}
