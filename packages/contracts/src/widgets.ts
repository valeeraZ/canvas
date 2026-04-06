import type { ChartWidgetConfig } from "./dashboard-editor.js";

export type WidgetType = "chart" | "table" | "metric" | "text";

export type DashboardWidgetRecord = {
  id: string;
  tenantId: string;
  dashboardId: string;
  type: WidgetType;
  datasetId: string | null;
  config: ChartWidgetConfig | null;
};
