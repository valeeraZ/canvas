import { describe, expect, it } from "vitest";
import { toDashboardWidgetRecord } from "./dashboard-widget-store";
import {
  compactDashboardWidgetLayouts,
  isValidDashboardWidgetLayout,
  normalizeDashboardWidgetLayout,
  swapDashboardWidgetLayouts
} from "./dashboard-widget-layout";

describe("toDashboardWidgetRecord", () => {
  it("maps the dashboard tenant slug into the widget record", () => {
    const widget = toDashboardWidgetRecord({
      id: "widget_1",
      tenantId: "tenant_row_1",
      dashboardId: "dash_1",
      type: "chart",
      datasetId: "ds_1",
      config: {
        datasetId: "ds_1",
        chartType: "bar",
        xField: "month",
        yField: "revenue"
      },
      layout: null,
      dashboard: {
        tenant: {
          slug: "canvas"
        }
      }
    } as any);

    expect(widget.tenantId).toBe("canvas");
    expect(widget.config?.chartType).toBe("bar");
    expect(widget.layout).toEqual({
      x: 0,
      y: 0,
      w: 1,
      h: 1
    });
  });

  it("preserves table chart widget configs without x and y fields", () => {
    const widget = toDashboardWidgetRecord({
      id: "widget_table",
      tenantId: "tenant_row_1",
      dashboardId: "dash_1",
      type: "chart",
      datasetId: "ds_1",
      config: {
        datasetId: "ds_1",
        chartType: "table",
        columns: ["month", "revenue"],
        pageSize: 10,
        title: "Sales rows"
      },
      layout: null,
      dashboard: {
        tenant: {
          slug: "canvas"
        }
      }
    } as any);

    expect(widget.config).toEqual({
      datasetId: "ds_1",
      chartType: "table",
      columns: ["month", "revenue"],
      pageSize: 10,
      title: "Sales rows"
    });
  });
});

describe("dashboard widget layout helpers", () => {
  it("normalizes partially missing layout fields through the shared helper", () => {
    expect(
      normalizeDashboardWidgetLayout(
        {
          x: 1,
          h: 3
        },
        4
      )
    ).toEqual({
      x: 1,
      y: 2,
      w: 1,
      h: 3
    });
  });

  it("inserts a moved widget into the target slot and pushes later widgets forward", () => {
    const widgets = swapDashboardWidgetLayouts(
      [
        {
          id: "widget_1",
          layout: { x: 0, y: 0, w: 1, h: 1 }
        },
        {
          id: "widget_2",
          layout: { x: 1, y: 0, w: 1, h: 1 }
        },
        {
          id: "widget_3",
          layout: { x: 0, y: 1, w: 1, h: 1 }
        }
      ],
      "widget_3",
      { x: 0, y: 0, w: 1, h: 1 }
    );

    expect(widgets.find((widget) => widget.id === "widget_3")?.layout).toEqual({
      x: 0,
      y: 0,
      w: 1,
      h: 1
    });
    expect(widgets.find((widget) => widget.id === "widget_1")?.layout).toEqual({
      x: 1,
      y: 0,
      w: 1,
      h: 1
    });
    expect(widgets.find((widget) => widget.id === "widget_2")?.layout).toEqual({
      x: 0,
      y: 1,
      w: 1,
      h: 1
    });
  });

  it("compacts remaining widgets into a stable two-column layout after delete", () => {
    const widgets = compactDashboardWidgetLayouts([
      {
        id: "widget_2",
        layout: { x: 1, y: 0, w: 1, h: 1 }
      },
      {
        id: "widget_3",
        layout: { x: 0, y: 1, w: 1, h: 1 }
      }
    ]);

    expect(widgets.map((widget) => widget.layout)).toEqual([
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 1, y: 0, w: 1, h: 1 }
    ]);
  });

  it("compacts full-width widgets without collapsing their stored span", () => {
    const widgets = compactDashboardWidgetLayouts([
      {
        id: "widget_1",
        layout: { x: 0, y: 0, w: 2, h: 1 }
      },
      {
        id: "widget_2",
        layout: { x: 1, y: 0, w: 1, h: 1 }
      },
      {
        id: "widget_3",
        layout: { x: 0, y: 1, w: 1, h: 1 }
      }
    ]);

    expect(widgets.map((widget) => widget.layout)).toEqual([
      { x: 0, y: 0, w: 2, h: 1 },
      { x: 0, y: 1, w: 1, h: 1 },
      { x: 1, y: 1, w: 1, h: 1 }
    ]);
  });

  it("rejects layouts whose width would overflow the two-column canvas", () => {
    expect(isValidDashboardWidgetLayout({ x: 1, y: 0, w: 2, h: 1 })).toBe(false);
  });
});
