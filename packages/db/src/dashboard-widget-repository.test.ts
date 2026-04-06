import { describe, expect, it } from "vitest";
import { buildDashboardWidget } from "./dashboard-widget-repository";

describe("buildDashboardWidget", () => {
  it("creates a dashboard widget bound to a dataset", () => {
    const widget = buildDashboardWidget({
      tenantId: "tenant_123",
      dashboardId: "dash_1",
      type: "metric",
      datasetId: "ds_9"
    });

    expect(widget.type).toBe("metric");
    expect(widget.datasetId).toBe("ds_9");
  });

  it("stores a chart widget config for editor rendering", () => {
    const widget = buildDashboardWidget({
      tenantId: "tenant_123",
      dashboardId: "dash_1",
      type: "chart",
      datasetId: "ds_9",
      config: {
        chartType: "line",
        xField: "month",
        yField: "revenue",
        seriesField: "region",
        title: "Revenue trend"
      }
    });

    expect(widget.config).toEqual({
      chartType: "line",
      xField: "month",
      yField: "revenue",
      seriesField: "region",
      title: "Revenue trend"
    });
  });
});
