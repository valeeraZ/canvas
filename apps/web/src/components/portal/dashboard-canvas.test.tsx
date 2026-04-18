import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

describe("DashboardCanvas", () => {
  it("renders a focused widget grid for multiple chart cards", async () => {
    const module = await import("./dashboard-canvas").catch(() => ({
      DashboardCanvas: null
    }));

    expect(module.DashboardCanvas).toBeTypeOf("function");

    const html = renderToString(
      <module.DashboardCanvas
        widgets={[
          {
            id: "widget_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            config: {
              datasetId: "ds_1",
              chartType: "bar",
              xField: "month",
              yField: "revenue",
              title: "Revenue by month"
            }
          },
          {
            id: "widget_2",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            config: {
              datasetId: "ds_1",
              chartType: "line",
              xField: "month",
              yField: "profit",
              title: "Margin by month"
            }
          }
        ]}
        activeWidgetId="widget_1"
      />
    );

    expect(html).toContain("Dashboard canvas");
    expect(html).toContain("Revenue by month");
    expect(html).toContain("Margin by month");
    expect(html).toContain('data-focused-widget="true"');
  });
});
