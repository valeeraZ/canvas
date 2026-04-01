import type { WorkbookRecord } from "../../../packages/contracts/src/workbooks.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { resolveTenantBySlug, tenantSlugInclude } from "./tenant-slug.js";

type PersistedWorkbook = {
  id: string;
  tenantId: string;
  name: string;
  tenant?: {
    slug: string;
  } | null;
};

export function toWorkbookRecord(input: PersistedWorkbook): WorkbookRecord {
  return {
    id: input.id,
    tenantId: input.tenant?.slug ?? input.tenantId,
    name: input.name
  };
}

export function createWorkbookStore(prisma: PrismaClient) {
  return {
    async create(input: { tenantId: string; name: string }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      const workbook = await prisma.workbook.create({
        data: {
          tenantId: tenant.id,
          name: input.name
        },
        include: tenantSlugInclude
      });

      return toWorkbookRecord(workbook);
    },
    async listByTenant(tenantId: string) {
      const workbooks = await prisma.workbook.findMany({
        where: {
          tenant: {
            slug: tenantId
          }
        },
        include: tenantSlugInclude,
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
          tenant: {
            slug: tenantId
          }
        },
        include: tenantSlugInclude
      });

      return workbook ? toWorkbookRecord(workbook) : null;
    }
  };
}
