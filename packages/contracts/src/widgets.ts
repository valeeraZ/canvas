import type { ChartWidgetConfig } from "./dashboard-editor.js";

export type WidgetType = "chart" | "table" | "metric" | "text";

export type DashboardWidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DashboardWidgetRecord = {
  id: string;
  tenantId: string;
  dashboardId: string;
  type: WidgetType;
  datasetId: string | null;
  config: ChartWidgetConfig | null;
  layout: DashboardWidgetLayout;
};
