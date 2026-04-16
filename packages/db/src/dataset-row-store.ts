import type { PrismaClient } from "./generated/prisma/client.js";

export type DatasetRowRecord = Record<
  string,
  string | number | boolean | null
>;

export function createDatasetRowStore(prisma: PrismaClient) {
  return {
    async replaceRows(input: {
      tenantId: string;
      datasetId: string;
      rows: DatasetRowRecord[];
    }) {
      return prisma.$transaction(async (tx) => {
        await tx.datasetRow.deleteMany({
          where: {
            tenantId: input.tenantId,
            datasetId: input.datasetId
          }
        });

        if (input.rows.length === 0) {
          return [];
        }

        return tx.datasetRow.createManyAndReturn({
          data: input.rows.map((record, index) => ({
            tenantId: input.tenantId,
            datasetId: input.datasetId,
            rowIndex: index,
            record
          }))
        });
      });
    },
    async listByDataset(input: {
      tenantId: string;
      datasetId: string;
    }) {
      return prisma.datasetRow.findMany({
        where: {
          tenantId: input.tenantId,
          datasetId: input.datasetId
        },
        orderBy: {
          rowIndex: "asc"
        }
      });
    }
  };
}
