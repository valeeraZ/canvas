import { describe, expect, it, vi } from "vitest";
import {
  createDashboardWidgetStore,
  toDashboardWidgetRecord
} from "./dashboard-widget-store";

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
      dashboard: {
        tenant: {
          slug: "canvas"
        }
      }
    } as any);

    expect(widget.tenantId).toBe("canvas");
    expect(widget.config?.chartType).toBe("bar");
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
  });
});
