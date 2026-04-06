import { describe, expect, it } from "vitest";
import { buildChartRenderModel } from "./chart-adapters";

describe("buildChartRenderModel", () => {
  it("maps grouped records for bar-like charts", () => {
    const model = buildChartRenderModel({
      chartType: "bar",
      xField: "month",
      yField: "revenue",
      seriesField: "region",
      records: [
        { month: "Jan", revenue: 120, region: "APAC" },
        { month: "Jan", revenue: 90, region: "EMEA" },
        { month: "Feb", revenue: 140, region: "APAC" }
      ]
    });

    expect(model.seriesKeys).toEqual(["APAC", "EMEA"]);
    expect(model.data[0]).toEqual({
      month: "Jan",
      APAC: 120,
      EMEA: 90
    });
  });

  it("maps pie chart records into label-value points", () => {
    const model = buildChartRenderModel({
      chartType: "pie",
      xField: "region",
      yField: "revenue",
      records: [
        { region: "APAC", revenue: 120 },
        { region: "EMEA", revenue: 90 }
      ]
    });

    expect(model.data).toEqual([
      { name: "APAC", value: 120 },
      { name: "EMEA", value: 90 }
    ]);
  });
});
