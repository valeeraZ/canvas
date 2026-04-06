import type {
  ChartWidgetConfig,
  DashboardWidgetRecord
} from "../../../packages/contracts/src/index.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { resolveTenantBySlug, tenantSlugInclude } from "./tenant-slug.js";

type PersistedDashboardWidget = {
  id: string;
  tenantId: string;
  dashboardId: string;
  type: string;
  datasetId: string | null;
  config: unknown;
  tenant?: {
    slug: string;
  } | null;
};

function normalizeChartWidgetConfig(input: unknown): ChartWidgetConfig | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const config = input as Record<string, unknown>;

  if (
    typeof config.datasetId !== "string" ||
    typeof config.chartType !== "string" ||
    typeof config.xField !== "string" ||
    typeof config.yField !== "string"
  ) {
    return null;
  }

  return {
    datasetId: config.datasetId,
    chartType: config.chartType as ChartWidgetConfig["chartType"],
    xField: config.xField,
    yField: config.yField,
    seriesField:
      typeof config.seriesField === "string" ? config.seriesField : undefined,
    title: typeof config.title === "string" ? config.title : undefined
  };
}

export function toDashboardWidgetRecord(
  input: PersistedDashboardWidget
): DashboardWidgetRecord {
  return {
    id: input.id,
    tenantId: input.tenant?.slug ?? input.tenantId,
    dashboardId: input.dashboardId,
    type: input.type as DashboardWidgetRecord["type"],
    datasetId: input.datasetId,
    config: normalizeChartWidgetConfig(input.config)
  };
}

export function createDashboardWidgetStore(prisma: PrismaClient) {
  return {
    async listByDashboard(input: { tenantId: string; dashboardId: string }) {
      const widgets = await prisma.dashboardWidget.findMany({
        where: {
          dashboardId: input.dashboardId,
          dashboard: {
            tenant: {
              slug: input.tenantId
            }
          }
        },
        include: tenantSlugInclude,
        orderBy: {
          id: "asc"
        }
      });

      return widgets.map(toDashboardWidgetRecord);
    },
    async create(input: {
      tenantId: string;
      dashboardId: string;
      type: DashboardWidgetRecord["type"];
      datasetId?: string | null;
      config?: ChartWidgetConfig | null;
    }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      const widget = await prisma.dashboardWidget.create({
        data: {
          tenantId: tenant.id,
          dashboardId: input.dashboardId,
          type: input.type,
          datasetId: input.datasetId ?? null,
          config: input.config ?? null
        },
        include: tenantSlugInclude
      });

      return toDashboardWidgetRecord(widget);
    },
    async update(input: {
      tenantId: string;
      dashboardId: string;
      widgetId: string;
      datasetId?: string | null;
      config?: ChartWidgetConfig | null;
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
        include: tenantSlugInclude
      });

      return toDashboardWidgetRecord(widget);
    }
  };
}
