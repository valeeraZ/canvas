import { describe, expect, it, vi } from "vitest";
import { createDatasetRowStore } from "./dataset-row-store";

describe("createDatasetRowStore", () => {
  it("replaces all rows for a dataset inside one transaction", async () => {
    const tx = {
      datasetRow: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        createManyAndReturn: vi.fn().mockResolvedValue([
          {
            id: "row_1",
            tenantId: "canvas",
            datasetId: "ds_1",
            rowIndex: 0,
            record: { month: "2026-04-01", revenue: 42 }
          },
          {
            id: "row_2",
            tenantId: "canvas",
            datasetId: "ds_1",
            rowIndex: 1,
            record: { month: "2026-04-02", revenue: 18 }
          }
        ])
      }
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx))
    } as never;

    const store = createDatasetRowStore(prisma);
    const rows = await store.replaceRows({
      tenantId: "canvas",
      datasetId: "ds_1",
      rows: [
        { month: "2026-04-01", revenue: 42 },
        { month: "2026-04-02", revenue: 18 }
      ]
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(tx.datasetRow.deleteMany).toHaveBeenCalledWith({
      where: {
        tenantId: "canvas",
        datasetId: "ds_1"
      }
    });
    expect(tx.datasetRow.createManyAndReturn).toHaveBeenCalledWith({
      data: [
        {
          tenantId: "canvas",
          datasetId: "ds_1",
          rowIndex: 0,
          record: { month: "2026-04-01", revenue: 42 }
        },
        {
          tenantId: "canvas",
          datasetId: "ds_1",
          rowIndex: 1,
          record: { month: "2026-04-02", revenue: 18 }
        }
      ]
    });
    expect(rows).toHaveLength(2);
  });

  it("lists stored rows in rowIndex order for one dataset", async () => {
    const prisma = {
      datasetRow: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "row_2",
            tenantId: "canvas",
            datasetId: "ds_1",
            rowIndex: 0,
            record: { month: "2026-04-01", revenue: 42 }
          },
          {
            id: "row_3",
            tenantId: "canvas",
            datasetId: "ds_1",
            rowIndex: 1,
            record: { month: "2026-04-02", revenue: 18 }
          }
        ])
      }
    } as never;

    const store = createDatasetRowStore(prisma);
    const rows = await store.listByDataset({
      tenantId: "canvas",
      datasetId: "ds_1"
    });

    expect(prisma.datasetRow.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: "canvas",
        datasetId: "ds_1"
      },
      orderBy: {
        rowIndex: "asc"
      }
    });
    expect(rows[0]?.record).toEqual({
      month: "2026-04-01",
      revenue: 42
    });
  });

  it("lists a paginated row slice and total count for one dataset", async () => {
    const prisma = {
      datasetRow: {
        count: vi.fn().mockResolvedValue(21),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "row_11",
            tenantId: "canvas",
            datasetId: "ds_1",
            rowIndex: 10,
            record: { month: "2026-04-11", revenue: 84 }
          }
        ])
      }
    } as never;

    const store = createDatasetRowStore(prisma);
    const page = await store.listPageByDataset({
      tenantId: "canvas",
      datasetId: "ds_1",
      page: 2,
      pageSize: 10
    });

    expect(prisma.datasetRow.count).toHaveBeenCalledWith({
      where: {
        tenantId: "canvas",
        datasetId: "ds_1"
      }
    });
    expect(prisma.datasetRow.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: "canvas",
        datasetId: "ds_1"
      },
      orderBy: {
        rowIndex: "asc"
      },
      skip: 10,
      take: 10
    });
    expect(page.totalRows).toBe(21);
    expect(page.rows[0]?.record).toEqual({ month: "2026-04-11", revenue: 84 });
  });
});
