import { describe, expect, it, vi } from "vitest";
import { runChartQuery } from "./run-chart-query";

describe("runChartQuery", () => {
  it("forwards dataset-scoped query inputs to the fixed-table query layer and maps chart payload", async () => {
    const runQueryImpl = vi.fn(async () => ({
      sql: "select 1",
      values: ["canvas", "ds_1"],
      rows: [
        { region: "APAC", amount: 42 },
        { region: "EMEA", amount: 18 }
      ]
    }));

    const payload = await runChartQuery({
      chartType: "bar",
      tenantId: "canvas",
      datasetId: "ds_1",
      xField: "region",
      yField: "amount",
      allowedFields: ["region", "amount"],
      runQueryImpl
    });

    expect(runQueryImpl).toHaveBeenCalledWith({
      tenantId: "canvas",
      datasetId: "ds_1",
      allowedFields: ["region", "amount"],
      dimensions: ["region"],
      measures: [{ field: "amount", op: "sum" }]
    });
    expect(payload.chartType).toBe("bar");
    expect(payload.labels).toEqual(["APAC", "EMEA"]);
    expect(payload.series).toEqual([
      {
        name: "amount",
        data: [42, 18]
      }
    ]);
  });

  it("rejects unsupported phase-1 chart types", async () => {
    await expect(
      runChartQuery({
        chartType: "pie",
        tenantId: "canvas",
        datasetId: "ds_1",
        xField: "region",
        yField: "amount",
        allowedFields: ["region", "amount"],
        runQueryImpl: vi.fn(async () => ({
          sql: "select 1",
          values: [],
          rows: []
        }))
      })
    ).rejects.toThrow("Unsupported chart type");
  });
});
