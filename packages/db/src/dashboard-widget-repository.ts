export function buildDashboardWidget(input: {
  tenantId: string;
  dashboardId: string;
  type: "chart" | "table" | "metric" | "text";
  datasetId?: string;
}) {
  return {
    tenantId: input.tenantId,
    dashboardId: input.dashboardId,
    type: input.type,
    datasetId: input.datasetId ?? null
  };
}
