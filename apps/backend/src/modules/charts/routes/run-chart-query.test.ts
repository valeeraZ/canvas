import { describe, expect, it } from "vitest";
import { runChartQuery } from "./run-chart-query";

describe("runChartQuery", () => {
  it("returns a bar chart payload", async () => {
    const payload = await runChartQuery({
      chartType: "bar",
      datasetId: "ds_1"
    });

    expect(payload.chartType).toBe("bar");
  });
});
