import type {
  ChartWidgetConfig,
  DashboardWidgetLayout,
  DashboardWidgetRecord,
  TableWidgetConfig
} from "../../../packages/contracts/src/index.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import {
  compactDashboardWidgetLayouts,
  isValidDashboardWidgetLayout,
  normalizeDashboardWidgetLayout,
  swapDashboardWidgetLayouts
} from "./dashboard-widget-layout.js";
import { resolveTenantBySlug } from "./tenant-slug.js";

type PersistedDashboardWidget = {
  id: string;
  tenantId: string;
  dashboardId: string;
  type: string;
  datasetId: string | null;
  config: unknown;
  layout?: unknown;
  dashboard?: {
    tenant?: {
      slug: string;
    } | null;
  } | null;
};

const dashboardTenantInclude = {
  dashboard: {
    include: {
      tenant: {
        select: {
          slug: true
        }
      }
    }
  }
} as const;

function normalizeChartWidgetConfig(input: Record<string, unknown>): ChartWidgetConfig | null {
  if (
    typeof input.datasetId !== "string" ||
    typeof input.chartType !== "string" ||
    typeof input.xField !== "string" ||
    typeof input.yField !== "string"
  ) {
    return null;
  }

  return {
    datasetId: input.datasetId,
    chartType: input.chartType as ChartWidgetConfig["chartType"],
    xField: input.xField,
    yField: input.yField,
    seriesField:
      typeof input.seriesField === "string" ? input.seriesField : undefined,
    title: typeof input.title === "string" ? input.title : undefined
  };
}

function normalizeTableWidgetConfig(input: Record<string, unknown>): TableWidgetConfig | null {
  if (
    input.chartType !== "table" ||
    typeof input.datasetId !== "string" ||
    !Array.isArray(input.columns) ||
    typeof input.pageSize !== "number"
  ) {
    return null;
  }

  const columns = input.columns.filter(
    (column): column is string => typeof column === "string"
  );

  if (columns.length !== input.columns.length) {
    return null;
  }

  return {
    datasetId: input.datasetId,
    chartType: "table",
    columns,
    pageSize: input.pageSize,
    title: typeof input.title === "string" ? input.title : undefined
  };
}

function normalizeWidgetConfig(input: unknown): ChartWidgetConfig | TableWidgetConfig | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const config = input as Record<string, unknown>;

  if (config.chartType === "table") {
    return normalizeTableWidgetConfig(config);
  }

  return normalizeChartWidgetConfig(config);
}

export function toDashboardWidgetRecord(
  input: PersistedDashboardWidget,
  index = 0
): DashboardWidgetRecord {
  return {
    id: input.id,
    tenantId: input.dashboard?.tenant?.slug ?? input.tenantId,
    dashboardId: input.dashboardId,
    type: input.type as DashboardWidgetRecord["type"],
    datasetId: input.datasetId,
    config: normalizeWidgetConfig(input.config),
    layout: normalizeDashboardWidgetLayout(
      input.layout as Partial<DashboardWidgetLayout> | null | undefined,
      index
    )
  };
}

export function createDashboardWidgetStore(prisma: PrismaClient) {
  async function listScopedWidgets(input: { tenantId: string; dashboardId: string }) {
    return prisma.dashboardWidget.findMany({
      where: {
        dashboardId: input.dashboardId,
        dashboard: {
          tenant: {
            slug: input.tenantId
          }
        }
      },
      include: dashboardTenantInclude,
      orderBy: {
        id: "asc"
      }
    });
  }

  return {
    async listByDashboard(input: { tenantId: string; dashboardId: string }) {
      const widgets = await listScopedWidgets(input);

      return widgets.map((widget, index) => toDashboardWidgetRecord(widget, index));
    },
    async create(input: {
      tenantId: string;
      dashboardId: string;
      type: DashboardWidgetRecord["type"];
      datasetId?: string | null;
      config?: ChartWidgetConfig | TableWidgetConfig | null;
    }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      const existingWidgets = await listScopedWidgets({
        tenantId: input.tenantId,
        dashboardId: input.dashboardId
      });
      const widget = await prisma.dashboardWidget.create({
        data: {
          tenantId: tenant.id,
          dashboardId: input.dashboardId,
          type: input.type,
          datasetId: input.datasetId ?? null,
          config: input.config ?? null,
          layout: normalizeDashboardWidgetLayout(null, existingWidgets.length)
        },
        include: dashboardTenantInclude
      });

      return toDashboardWidgetRecord(widget, existingWidgets.length);
    },
    async update(input: {
      tenantId: string;
      dashboardId: string;
      widgetId: string;
      datasetId?: string | null;
      config?: ChartWidgetConfig | TableWidgetConfig | null;
    }) {
      const existing = await prisma.dashboardWidget.findFirst({
        where: {
          id: input.widgetId,
          dashboardId: input.dashboardId,
          dashboard: {
            tenant: {
              slug: input.tenantId
            }
          }
        },
        select: {
          id: true
        }
      });

      if (!existing) {
        return null;
      }

      const widget = await prisma.dashboardWidget.update({
        where: {
          id: input.widgetId
        },
        data: {
          datasetId: input.datasetId ?? null,
          config: input.config ?? null
        },
        include: dashboardTenantInclude
      });

      return toDashboardWidgetRecord(widget);
    },
    async updateLayout(input: {
      tenantId: string;
      dashboardId: string;
      widgetId: string;
      layout: DashboardWidgetLayout;
    }) {
      if (!isValidDashboardWidgetLayout(input.layout)) {
        throw new Error("Invalid dashboard widget layout");
      }

      const widgets = (await listScopedWidgets({
        tenantId: input.tenantId,
        dashboardId: input.dashboardId
      })).map((widget, index) => toDashboardWidgetRecord(widget, index));
      const nextWidgets = swapDashboardWidgetLayouts(
        widgets,
        input.widgetId,
        input.layout
      );
      const targetWidget = nextWidgets.find((widget) => widget.id === input.widgetId);

      if (!targetWidget) {
        return null;
      }

      await prisma.$transaction(
        nextWidgets.map((widget) =>
          prisma.dashboardWidget.update({
            where: {
              id: widget.id
            },
            data: {
              layout: widget.layout
            }
          })
        )
      );

      return targetWidget;
    },
    async delete(input: {
      tenantId: string;
      dashboardId: string;
      widgetId: string;
    }) {
      const widgets = (await listScopedWidgets({
        tenantId: input.tenantId,
        dashboardId: input.dashboardId
      })).map((widget, index) => toDashboardWidgetRecord(widget, index));
      const widgetToDelete = widgets.find((widget) => widget.id === input.widgetId);

      if (!widgetToDelete) {
        return null;
      }

      const remainingWidgets = compactDashboardWidgetLayouts(
        widgets.filter((widget) => widget.id !== input.widgetId)
      );

      await prisma.$transaction([
        prisma.dashboardWidget.delete({
          where: {
            id: input.widgetId
          }
        }),
        ...remainingWidgets.map((widget) =>
          prisma.dashboardWidget.update({
            where: {
              id: widget.id
            },
            data: {
              layout: widget.layout
            }
          })
        )
      ]);

      return {
        deletedWidgetId: input.widgetId,
        widgets: remainingWidgets
      };
    }
  };
}
