import { describe, expect, it, vi } from "vitest";
import {
  createDashboardWidgetStore,
  toDashboardWidgetRecord
} from "./dashboard-widget-store";
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
});

describe("createDashboardWidgetStore", () => {
  it("loads dashboard tenant context when listing widgets", async () => {
    const prisma = {
      dashboardWidget: {
        findMany: vi.fn().mockResolvedValue([
          {
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
          }
        ])
      }
    } as never;

    const store = createDashboardWidgetStore(prisma);
    const widgets = await store.listByDashboard({
      tenantId: "canvas",
      dashboardId: "dash_1"
    });

    expect(prisma.dashboardWidget.findMany).toHaveBeenCalledWith({
      where: {
        dashboardId: "dash_1",
        dashboard: {
          tenant: {
            slug: "canvas"
          }
        }
      },
      include: {
        dashboard: {
          include: {
            tenant: {
              select: {
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        id: "asc"
      }
    });
    expect(widgets[0]?.tenantId).toBe("canvas");
    expect(widgets[0]?.layout).toEqual({
      x: 0,
      y: 0,
      w: 1,
      h: 1
    });
  });

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

  it("assigns the next default layout when creating a widget", async () => {
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "widget_1",
          tenantId: "tenant_row_1",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          config: null,
          layout: null,
          dashboard: {
            tenant: {
              slug: "canvas"
            }
          }
        }
      ]);
    const create = vi.fn().mockResolvedValue({
      id: "widget_2",
      tenantId: "tenant_row_1",
      dashboardId: "dash_1",
      type: "chart",
      datasetId: "ds_1",
      config: null,
      layout: {
        x: 1,
        y: 0,
        w: 1,
        h: 1
      },
      dashboard: {
        tenant: {
          slug: "canvas"
        }
      }
    });
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dashboardWidget: {
        findMany,
        create
      }
    } as never;

    const store = createDashboardWidgetStore(prisma);
    const widget = await store.create({
      tenantId: "canvas",
      dashboardId: "dash_1",
      type: "chart",
      datasetId: "ds_1"
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          layout: {
            x: 1,
            y: 0,
            w: 1,
            h: 1
          }
        })
      })
    );
    expect(widget.layout).toEqual({
      x: 1,
      y: 0,
      w: 1,
      h: 1
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
