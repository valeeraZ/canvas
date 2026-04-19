import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import {
  previewDashboardCanvasSwap,
  sortDashboardCanvasWidgets
} from "./dashboard-canvas";

describe("DashboardCanvas", () => {
  it("renders widgets in layout order and shows edit controls", async () => {
    const module = await import("./dashboard-canvas").catch(() => ({
      DashboardCanvas: null
    }));

    expect(module.DashboardCanvas).toBeTypeOf("function");

    const html = renderToString(
      <module.DashboardCanvas
        widgets={[
          {
            id: "widget_2",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            layout: {
              x: 1,
              y: 0,
              w: 1,
              h: 1
            },
            config: {
              datasetId: "ds_1",
              chartType: "bar",
              xField: "month",
              yField: "revenue",
              title: "Revenue by month"
            }
          },
          {
            id: "widget_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            layout: {
              x: 0,
              y: 0,
              w: 1,
              h: 1
            },
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
    expect(html.indexOf("Margin by month")).toBeLessThan(html.indexOf("Revenue by month"));
    expect(html).toContain("Revenue by month");
    expect(html).toContain("Margin by month");
    expect(html).toContain("Drag widget");
    expect(html).toContain("Delete widget");
    expect(html).toContain('data-focused-widget="true"');
  });

  it("previews swap ordering when dragging over another widget", () => {
    const widgets = previewDashboardCanvasSwap(
      [
        {
          id: "widget_1",
          tenantId: "canvas",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          layout: { x: 0, y: 0, w: 1, h: 1 },
          config: null
        },
        {
          id: "widget_2",
          tenantId: "canvas",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          layout: { x: 1, y: 0, w: 1, h: 1 },
          config: null
        }
      ],
      "widget_1",
      "widget_2"
    );

    expect(sortDashboardCanvasWidgets(widgets).map((widget) => widget.id)).toEqual([
      "widget_2",
      "widget_1"
    ]);
  });
});
