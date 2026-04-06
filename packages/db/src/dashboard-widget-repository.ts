import type { ChartWidgetConfig } from "@canvas/contracts";

export function buildDashboardWidget(input: {
  tenantId: string;
  dashboardId: string;
  type: "chart" | "table" | "metric" | "text";
  datasetId?: string;
  config?: ChartWidgetConfig | null;
}) {
  return {
    tenantId: input.tenantId,
    dashboardId: input.dashboardId,
    type: input.type,
    datasetId: input.datasetId ?? null,
    config: input.config ?? null
  };
}
