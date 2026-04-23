import type {
  ChartWidgetConfig,
  DashboardWidgetLayout,
  DashboardWidgetRecord
} from "../../../packages/contracts/src/index.js";
import type { TableWidgetConfig } from "../../../packages/contracts/src/dashboard-editor.js";
import { and, asc, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import {
  compactDashboardWidgetLayouts,
  isValidDashboardWidgetLayout,
  normalizeDashboardWidgetLayout,
  swapDashboardWidgetLayouts
} from "./dashboard-widget-layout.js";
import { dashboardWidgets, dashboards, tenants } from "./schema.js";
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

type WidgetRowWithSlug = {
  id: string;
  tenantId: string;
  dashboardId: string;
  type: string;
  datasetId: string | null;
  config: unknown;
  layout: unknown;
  tenantSlug: string;
};

function toWidgetRecordWithSlug(input: WidgetRowWithSlug, index = 0) {
  return toDashboardWidgetRecord(
    {
      id: input.id,
      tenantId: input.tenantId,
      dashboardId: input.dashboardId,
      type: input.type,
      datasetId: input.datasetId,
      config: input.config,
      layout: input.layout,
      dashboard: {
        tenant: {
          slug: input.tenantSlug
        }
      }
    },
    index
  );
}

function widgetSelection() {
  return {
    id: dashboardWidgets.id,
    tenantId: dashboardWidgets.tenantId,
    dashboardId: dashboardWidgets.dashboardId,
    type: dashboardWidgets.type,
    datasetId: dashboardWidgets.datasetId,
    config: dashboardWidgets.config,
    layout: dashboardWidgets.layout,
    tenantSlug: tenants.slug
  };
}

export function createDashboardWidgetStore(db: DbClient) {
  async function listScopedWidgets(input: { tenantId: string; dashboardId: string }) {
    return db
      .select(widgetSelection())
      .from(dashboardWidgets)
      .innerJoin(dashboards, eq(dashboardWidgets.dashboardId, dashboards.id))
      .innerJoin(tenants, eq(dashboards.tenantId, tenants.id))
      .where(
        and(
          eq(dashboardWidgets.dashboardId, input.dashboardId),
          eq(tenants.slug, input.tenantId)
        )
      )
      .orderBy(asc(dashboardWidgets.id));
  }

  return {
    async listByDashboard(input: { tenantId: string; dashboardId: string }) {
      const widgets = await listScopedWidgets(input);

      return widgets.map((widget, index) => toWidgetRecordWithSlug(widget, index));
    },
    async create(input: {
      tenantId: string;
      dashboardId: string;
      type: DashboardWidgetRecord["type"];
      datasetId?: string | null;
      config?: ChartWidgetConfig | TableWidgetConfig | null;
    }) {
      const tenant = await resolveTenantBySlug(db, input.tenantId);
      const existingWidgets = await listScopedWidgets({
        tenantId: input.tenantId,
        dashboardId: input.dashboardId
      });
      const [widget] = await db
        .insert(dashboardWidgets)
        .values({
          tenantId: tenant.id,
          dashboardId: input.dashboardId,
          type: input.type,
          datasetId: input.datasetId ?? null,
          config: input.config ?? null,
          layout: normalizeDashboardWidgetLayout(null, existingWidgets.length)
        })
        .returning();

      return toDashboardWidgetRecord(
        { ...widget, dashboard: { tenant: { slug: tenant.slug } } },
        existingWidgets.length
      );
    },
    async update(input: {
      tenantId: string;
      dashboardId: string;
      widgetId: string;
      datasetId?: string | null;
      config?: ChartWidgetConfig | TableWidgetConfig | null;
    }) {
      const existing = await listScopedWidgets(input);

      if (!existing.some((widget) => widget.id === input.widgetId)) {
        return null;
      }

      const [widget] = await db
        .update(dashboardWidgets)
        .set({
          datasetId: input.datasetId ?? null,
          config: input.config ?? null
        })
        .where(eq(dashboardWidgets.id, input.widgetId))
        .returning();

      return toDashboardWidgetRecord({
        ...widget,
        dashboard: { tenant: { slug: input.tenantId } }
      });
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
      })).map((widget, index) => toWidgetRecordWithSlug(widget, index));
      const nextWidgets = swapDashboardWidgetLayouts(
        widgets,
        input.widgetId,
        input.layout
      );
      const targetWidget = nextWidgets.find((widget) => widget.id === input.widgetId);

      if (!targetWidget) {
        return null;
      }

      await db.transaction(async (tx) => {
        for (const widget of nextWidgets) {
          await tx
            .update(dashboardWidgets)
            .set({ layout: widget.layout })
            .where(eq(dashboardWidgets.id, widget.id));
        }
      });

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
      })).map((widget, index) => toWidgetRecordWithSlug(widget, index));
      const widgetToDelete = widgets.find((widget) => widget.id === input.widgetId);

      if (!widgetToDelete) {
        return null;
      }

      const remainingWidgets = compactDashboardWidgetLayouts(
        widgets.filter((widget) => widget.id !== input.widgetId)
      );

      await db.transaction(async (tx) => {
        await tx
          .delete(dashboardWidgets)
          .where(eq(dashboardWidgets.id, input.widgetId));

        for (const widget of remainingWidgets) {
          await tx
            .update(dashboardWidgets)
            .set({ layout: widget.layout })
            .where(eq(dashboardWidgets.id, widget.id));
        }
      });

      return {
        deletedWidgetId: input.widgetId,
        widgets: remainingWidgets
      };
    }
  };
}
