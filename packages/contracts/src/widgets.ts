export type WidgetType = "chart" | "table" | "metric" | "text";

export type DashboardWidgetRecord = {
  tenantId: string;
  dashboardId: string;
  type: WidgetType;
  datasetId: string | null;
};
