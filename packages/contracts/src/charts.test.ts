import { describe, expect, it } from "vitest";
import type { ChartPayload, ChartQueryRequest } from "./charts";

describe("chart contracts", () => {
  it("describes the dataset chart-query request", () => {
    const request: ChartQueryRequest = {
      datasetId: "ds_sales",
      chartType: "bar",
      xField: "month",
      yField: "revenue"
    };

    expect(request.chartType).toBe("bar");
    expect(request.datasetId).toBe("ds_sales");
  });

  it("describes the chart payload returned from real query rows", () => {
    const payload: ChartPayload = {
      chartType: "line",
      labels: ["Jan", "Feb"],
      series: [
        {
          name: "revenue",
          data: [120, 150]
        }
      ]
    };

    expect(payload.chartType).toBe("line");
    expect(payload.series[0]?.data[1]).toBe(150);
  });
});
