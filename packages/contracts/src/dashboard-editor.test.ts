import { describe, expect, it } from "vitest";
import type { ChartWidgetConfig, DatasetPreview } from "./dashboard-editor";

describe("dashboard editor contracts", () => {
  it("describes a chart widget config for dashboard rendering", () => {
    const config: ChartWidgetConfig = {
      datasetId: "ds_sales",
      chartType: "bar",
      xField: "month",
      yField: "revenue",
      seriesField: "region",
      title: "Monthly revenue"
    };

    expect(config.chartType).toBe("bar");
    expect(config.seriesField).toBe("region");
  });

  it("describes normalized dataset preview data", () => {
    const preview: DatasetPreview = {
      datasetId: "ds_sales",
      columns: [
        { name: "month", type: "string" },
        { name: "revenue", type: "number" },
        { name: "active", type: "boolean" }
      ],
      sampleRows: [{ month: "Jan", revenue: 120, active: true }]
    };

    expect(preview.columns[1]?.type).toBe("number");
    expect(preview.sampleRows[0]?.month).toBe("Jan");
  });
});
