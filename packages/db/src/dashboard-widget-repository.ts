import type { ChartWidgetConfig, DashboardWidgetLayout } from "@canvas/contracts";
import { getDefaultDashboardWidgetLayout } from "./dashboard-widget-layout.js";

export function buildDashboardWidget(input: {
  tenantId: string;
  dashboardId: string;
  type: "chart" | "table" | "metric" | "text";
  datasetId?: string;
  config?: ChartWidgetConfig | null;
  layout?: DashboardWidgetLayout | null;
}) {
  return {
    tenantId: input.tenantId,
    dashboardId: input.dashboardId,
    type: input.type,
    datasetId: input.datasetId ?? null,
    config: input.config ?? null,
    layout: input.layout ?? getDefaultDashboardWidgetLayout(0)
  };
}
