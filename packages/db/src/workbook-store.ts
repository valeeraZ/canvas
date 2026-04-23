import type { WorkbookRecord } from "../../../packages/contracts/src/workbooks.js";
import { and, asc, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { tenants, workbooks } from "./schema.js";
import { resolveTenantBySlug } from "./tenant-slug.js";

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

export function createWorkbookStore(db: DbClient) {
  return {
    async create(input: { tenantId: string; name: string }) {
      const tenant = await resolveTenantBySlug(db, input.tenantId);
      const [workbook] = await db
        .insert(workbooks)
        .values({
          tenantId: tenant.id,
          name: input.name
        })
        .returning();

      return toWorkbookRecord({ ...workbook, tenant: { slug: tenant.slug } });
    },
    async listByTenant(tenantId: string) {
      const rows = await db
        .select({
          id: workbooks.id,
          tenantId: workbooks.tenantId,
          name: workbooks.name,
          tenantSlug: tenants.slug
        })
        .from(workbooks)
        .innerJoin(tenants, eq(workbooks.tenantId, tenants.id))
        .where(eq(tenants.slug, tenantId))
        .orderBy(asc(workbooks.name));

      return rows.map((row) =>
        toWorkbookRecord({
          id: row.id,
          tenantId: row.tenantId,
          name: row.name,
          tenant: { slug: row.tenantSlug }
        })
      );
    },
    async findByTenantAndId(tenantId: string, workbookId: string) {
      const [workbook] = await db
        .select({
          id: workbooks.id,
          tenantId: workbooks.tenantId,
          name: workbooks.name,
          tenantSlug: tenants.slug
        })
        .from(workbooks)
        .innerJoin(tenants, eq(workbooks.tenantId, tenants.id))
        .where(and(eq(workbooks.id, workbookId), eq(tenants.slug, tenantId)))
        .limit(1);

      return workbook
        ? toWorkbookRecord({
            id: workbook.id,
            tenantId: workbook.tenantId,
            name: workbook.name,
            tenant: { slug: workbook.tenantSlug }
          })
        : null;
    }
  };
}
