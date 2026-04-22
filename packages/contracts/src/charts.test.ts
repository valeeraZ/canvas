import { describe, expect, it } from "vitest";
import type { ChartPayload, ChartQueryRequest } from "./charts";

describe("chart contracts", () => {
  it("describes the dataset chart-query request", () => {
    const request: ChartQueryRequest = {
      datasetId: "ds_sales",
      chartType: "radial",
      xField: "month",
      yField: "revenue"
    };

    expect(request.chartType).toBe("radial");
    expect(request.datasetId).toBe("ds_sales");
  });

  it("describes the chart payload returned from real query rows", () => {
    const payload: ChartPayload = {
      chartType: "radar",
      labels: ["Jan", "Feb"],
      series: [
        {
          name: "revenue",
          data: [120, 150]
        }
      ]
    };

    expect(payload.chartType).toBe("radar");
    expect(payload.series[0]?.data[1]).toBe(150);
  });

  it("supports categorical share chart query types", () => {
    const requests: ChartQueryRequest[] = ["pie", "radar", "radial"].map(
      (chartType) => ({
        datasetId: "ds_sales",
        chartType,
        xField: "region",
        yField: "revenue"
      })
    );

    expect(requests.map((request) => request.chartType)).toEqual([
      "pie",
      "radar",
      "radial"
    ]);
  });
});
