import { describe, expect, it, vi } from "vitest";
import { runChartQuery } from "./run-chart-query";

describe("runChartQuery", () => {
  it("forwards dataset-scoped query inputs to the fixed-table query layer", async () => {
    const runQueryImpl = vi.fn(async () => ({
      sql: "select 1",
      values: ["canvas", "ds_1"],
      rows: []
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
  });
});
