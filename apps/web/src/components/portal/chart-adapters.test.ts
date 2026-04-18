import { describe, expect, it } from "vitest";
import { buildChartRenderModel } from "./chart-adapters";

describe("buildChartRenderModel", () => {
  it("maps chart payload labels and series into chart rows", () => {
    const model = buildChartRenderModel({
      chartType: "bar",
      labels: ["Jan", "Feb"],
      series: [
        {
          name: "revenue",
          data: [120, 140]
        },
        {
          name: "cost",
          data: [80, 95]
        }
      ]
    });

    expect(model.seriesKeys).toEqual(["revenue", "cost"]);
    expect(model.data[0]).toEqual({
      label: "Jan",
      revenue: 120,
      cost: 80
    });
  });

  it("returns an empty model when the payload has no series", () => {
    const model = buildChartRenderModel({
      chartType: "line",
      labels: [],
      series: []
    });

    expect(model.seriesKeys).toEqual([]);
    expect(model.data).toEqual([]);
  });
});
