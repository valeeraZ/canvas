import { and, asc, count, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { datasetRows } from "./schema.js";

export type DatasetRowRecord = Record<
  string,
  string | number | boolean | null
>;

export function createDatasetRowStore(db: DbClient) {
  return {
    async replaceRows(input: {
      tenantId: string;
      datasetId: string;
      rows: DatasetRowRecord[];
    }) {
      return db.transaction(async (tx) => {
        await tx
          .delete(datasetRows)
          .where(
            and(
              eq(datasetRows.tenantId, input.tenantId),
              eq(datasetRows.datasetId, input.datasetId)
            )
          );

        if (input.rows.length === 0) {
          return [];
        }

        return tx
          .insert(datasetRows)
          .values(
            input.rows.map((record, index) => ({
              tenantId: input.tenantId,
              datasetId: input.datasetId,
              rowIndex: index,
              record
            }))
          )
          .returning();
      });
    },
    async listByDataset(input: {
      tenantId: string;
      datasetId: string;
    }) {
      return db
        .select()
        .from(datasetRows)
        .where(
          and(
            eq(datasetRows.tenantId, input.tenantId),
            eq(datasetRows.datasetId, input.datasetId)
          )
        )
        .orderBy(asc(datasetRows.rowIndex));
    },
    async listPageByDataset(input: {
      tenantId: string;
      datasetId: string;
      page: number;
      pageSize: number;
    }) {
      const page = Math.max(1, Math.floor(input.page));
      const pageSize = Math.max(1, Math.floor(input.pageSize));
      const where = and(
        eq(datasetRows.tenantId, input.tenantId),
        eq(datasetRows.datasetId, input.datasetId)
      );
      const [totalRowsResult, rows] = await Promise.all([
        db.select({ value: count() }).from(datasetRows).where(where),
        db
          .select()
          .from(datasetRows)
          .where(where)
          .orderBy(asc(datasetRows.rowIndex))
          .offset((page - 1) * pageSize)
          .limit(pageSize)
      ]);

      return {
        rows,
        page,
        pageSize,
        totalRows: totalRowsResult[0]?.value ?? 0
      };
    }
  };
}
