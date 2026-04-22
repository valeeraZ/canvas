import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardWidgetCard } from "./dashboard-widget-card";
import {
  previewDashboardCanvasSwap,
  resolveCommittedMoveTargetWidgetId,
  resolvePreviewMoveTargetWidgetId,
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
    expect(html).toContain("Enlarge widget");
    expect(html).toContain("Drag widget");
    expect(html).toContain("Delete widget");
    expect(html).toContain('data-focused-widget="true"');
  });

  it("renders a full-width widget with shrink control and column span class", async () => {
    const module = await import("./dashboard-canvas").catch(() => ({
      DashboardCanvas: null
    }));

    const html = renderToString(
      <module.DashboardCanvas
        widgets={[
          {
            id: "widget_full",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            layout: {
              x: 0,
              y: 0,
              w: 2,
              h: 1
            },
            config: {
              datasetId: "ds_1",
              chartType: "bar",
              xField: "month",
              yField: "revenue",
              title: "Revenue overview"
            }
          }
        ]}
        activeWidgetId="widget_full"
      />
    );

    expect(html).toContain("Shrink widget");
    expect(html).toContain("md:col-span-2");
  });

  it("uses a stable fallback label for untitled widgets", async () => {
    const module = await import("./dashboard-canvas").catch(() => ({
      DashboardCanvas: null
    }));

    const html = renderToString(
      <module.DashboardCanvas
        widgets={[
          {
            id: "widget_untitled",
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
            config: null
          }
        ]}
        activeWidgetId="widget_untitled"
      />
    );

    expect(html).toContain("Chart widget");
    expect(html).not.toContain("Chart widget 1");
  });

  it("routes table widgets to the table renderer", async () => {
    const module = await import("./dashboard-canvas").catch(() => ({
      DashboardCanvas: null
    }));

    const html = renderToString(
      <module.DashboardCanvas
        widgets={[
          {
            id: "table_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "table",
            datasetId: "ds_1",
            layout: { x: 0, y: 0, w: 2, h: 1 },
            config: {
              datasetId: "ds_1",
              columns: ["month", "revenue"],
              pageSize: 10,
              title: "Sales rows"
            }
          }
        ]}
        activeWidgetId="table_1"
        tableStates={{
          table_1: {
            status: "ready",
            payload: {
              columns: ["month", "revenue"],
              rows: [{ month: "Jan", revenue: 120 }],
              page: 1,
              pageSize: 10,
              totalRows: 1
            }
          }
        }}
      />
    );

    expect(html).toContain("Sales rows");
    expect(html).toContain("Jan");
    expect(html).not.toContain("Configure a dataset and chart fields");
  });

  it("routes chart widgets with table chartType to the table renderer", async () => {
    const module = await import("./dashboard-canvas").catch(() => ({
      DashboardCanvas: null
    }));

    const html = renderToString(
      <module.DashboardCanvas
        widgets={[
          {
            id: "table_chart_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            layout: { x: 0, y: 0, w: 2, h: 1 },
            config: {
              datasetId: "ds_1",
              chartType: "table",
              columns: ["month", "revenue"],
              pageSize: 10,
              title: "Sales rows"
            }
          }
        ]}
        activeWidgetId="table_chart_1"
        tableStates={{
          table_chart_1: {
            status: "ready",
            payload: {
              columns: ["month", "revenue"],
              rows: [{ month: "Jan", revenue: 120 }],
              page: 1,
              pageSize: 10,
              totalRows: 1
            }
          }
        }}
      />
    );

    expect(html).toContain("Sales rows");
    expect(html).toContain("Jan");
    expect(html).not.toContain("Configure a dataset and chart fields");
  });

  it("renders drag activator props on the grip button instead of the card root", () => {
    const html = renderToString(
      <DashboardWidgetCard
        widget={{
          id: "widget_1",
          tenantId: "canvas",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          config: null
        }}
        index={0}
        focused={false}
        pending={false}
        chartState={{ status: "idle" }}
        dragHandleProps={{
          name: "drag-handle-test"
        }}
      />
    );

    expect(html).toContain('name="drag-handle-test"');
    expect(html).toContain('aria-label="Drag widget"');
  });

  it("previews insertion ordering when dragging the third widget over the first", () => {
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
        },
        {
          id: "widget_3",
          tenantId: "canvas",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          layout: { x: 0, y: 1, w: 1, h: 1 },
          config: null
        }
      ],
      "widget_3",
      "widget_1"
    );

    expect(sortDashboardCanvasWidgets(widgets).map((widget) => widget.id)).toEqual([
      "widget_3",
      "widget_1",
      "widget_2",
    ]);
  });

  it("resolves a persisted move target from the preview layout when drag end loses over state", () => {
    const widgets = [
      {
        id: "widget_1",
        tenantId: "canvas",
        dashboardId: "dash_1",
        type: "chart" as const,
        datasetId: "ds_1",
        layout: { x: 0, y: 0, w: 1, h: 1 },
        config: null
      },
      {
        id: "widget_2",
        tenantId: "canvas",
        dashboardId: "dash_1",
        type: "chart" as const,
        datasetId: "ds_1",
        layout: { x: 1, y: 0, w: 1, h: 1 },
        config: null
      },
      {
        id: "widget_3",
        tenantId: "canvas",
        dashboardId: "dash_1",
        type: "chart" as const,
        datasetId: "ds_1",
        layout: { x: 0, y: 1, w: 1, h: 1 },
        config: null
      }
    ];

    const previewWidgets = previewDashboardCanvasSwap(widgets, "widget_3", "widget_1");

    expect(
      resolvePreviewMoveTargetWidgetId({
        widgets,
        previewWidgets,
        draggedWidgetId: "widget_3"
      })
    ).toBe("widget_1");
  });

  it("falls back to the last hovered widget when preview target resolution is unavailable", () => {
    expect(
      resolveCommittedMoveTargetWidgetId({
        draggedWidgetId: "widget_3",
        previewTargetWidgetId: null,
        explicitTargetWidgetId: "widget_3",
        lastOverWidgetId: "widget_1"
      })
    ).toBe("widget_1");
  });
});
