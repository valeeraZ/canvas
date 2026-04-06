import { describe, expect, it, vi } from "vitest";
import { writeNormalizedTable } from "./write-normalized-table";

describe("writeNormalizedTable", () => {
  it("creates a canonical dataset table and inserts normalized rows", async () => {
    const db = {
      $executeRawUnsafe: vi.fn(async () => undefined)
    };

    const result = await writeNormalizedTable({
      db,
      tenantId: "canvas",
      datasetId: "sales-q2",
      headers: ["order_date", "net_revenue"],
      rows: [
        ["2026-04-01", "42"],
        ["2026-04-02", null]
      ]
    });

    expect(result).toEqual({
      tableName: "tenant_canvas_dataset_sales_q2",
      rowCount: 2
    });
    expect(db.$executeRawUnsafe).toHaveBeenCalledTimes(3);
    expect(db.$executeRawUnsafe).toHaveBeenNthCalledWith(
      1,
      'DROP TABLE IF EXISTS "tenant_canvas_dataset_sales_q2"'
    );
    expect(db.$executeRawUnsafe).toHaveBeenNthCalledWith(
      2,
      'CREATE TABLE "tenant_canvas_dataset_sales_q2" ("order_date" TEXT, "net_revenue" TEXT)'
    );
    expect(db.$executeRawUnsafe).toHaveBeenNthCalledWith(
      3,
      'INSERT INTO "tenant_canvas_dataset_sales_q2" ("order_date", "net_revenue") VALUES ($1, $2), ($3, $4)',
      "2026-04-01",
      "42",
      "2026-04-02",
      null
    );
  });

  it("skips inserts when the imported dataset is empty", async () => {
    const db = {
      $executeRawUnsafe: vi.fn(async () => undefined)
    };

    const result = await writeNormalizedTable({
      db,
      tenantId: "canvas",
      datasetId: "empty",
      headers: ["month"],
      rows: []
    });

    expect(result).toEqual({
      tableName: "tenant_canvas_dataset_empty",
      rowCount: 0
    });
    expect(db.$executeRawUnsafe).toHaveBeenCalledTimes(2);
  });
});
