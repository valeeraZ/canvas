import { describe, expect, it } from "vitest";
import type {
  ChartWidgetConfig,
  DatasetPreview,
  TableRowsPayload,
  TableWidgetConfig
} from "./dashboard-editor";

describe("dashboard editor contracts", () => {
  it("describes a chart widget config for dashboard rendering", () => {
    const config: ChartWidgetConfig = {
      datasetId: "ds_sales",
      chartType: "radial",
      xField: "month",
      yField: "revenue",
      seriesField: "region",
      title: "Monthly revenue"
    };

    expect(config.chartType).toBe("radial");
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

  it("describes table widget config and paginated row payloads", () => {
    const config: TableWidgetConfig = {
      datasetId: "ds_sales",
      columns: ["month", "revenue"],
      pageSize: 10,
      title: "Sales rows"
    };
    const payload: TableRowsPayload = {
      columns: ["month", "revenue"],
      rows: [{ month: "Jan", revenue: 120 }],
      page: 2,
      pageSize: 10,
      totalRows: 21
    };

    expect(config.columns).toEqual(["month", "revenue"]);
    expect(payload.totalRows).toBe(21);
  });
});
