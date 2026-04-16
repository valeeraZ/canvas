import { describe, expect, it, vi } from "vitest";
import { writeNormalizedTable } from "./write-normalized-table";

describe("writeNormalizedTable", () => {
  it("replaces imported rows through the shared DatasetRow store", async () => {
    const datasetRows = {
      replaceRows: vi.fn(async () => [
        {
          id: "row_1",
          tenantId: "canvas",
          datasetId: "sales-q2",
          rowIndex: 0,
          record: {
            order_date: "2026-04-01",
            net_revenue: "42"
          }
        },
        {
          id: "row_2",
          tenantId: "canvas",
          datasetId: "sales-q2",
          rowIndex: 1,
          record: {
            order_date: "2026-04-02",
            net_revenue: null
          }
        }
      ])
    };

    const result = await writeNormalizedTable({
      datasetRows,
      tenantId: "canvas",
      datasetId: "sales-q2",
      headers: ["order_date", "net_revenue"],
      rows: [
        ["2026-04-01", "42"],
        ["2026-04-02", null]
      ]
    });

    expect(result).toEqual({
      rowCount: 2
    });
    expect(datasetRows.replaceRows).toHaveBeenCalledWith({
      tenantId: "canvas",
      datasetId: "sales-q2",
      rows: [
        {
          order_date: "2026-04-01",
          net_revenue: "42"
        },
        {
          order_date: "2026-04-02",
          net_revenue: null
        }
      ]
    });
  });

  it("replaces dataset rows with an empty collection when the import is empty", async () => {
    const datasetRows = {
      replaceRows: vi.fn(async () => [])
    };

    const result = await writeNormalizedTable({
      datasetRows,
      tenantId: "canvas",
      datasetId: "empty",
      headers: ["month"],
      rows: []
    });

    expect(result).toEqual({
      rowCount: 0
    });
    expect(datasetRows.replaceRows).toHaveBeenCalledWith({
      tenantId: "canvas",
      datasetId: "empty",
      rows: []
    });
  });
});
