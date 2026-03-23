import { getPortalDemoStore } from "../../../../lib/portal/demo-store";

export async function GET() {
  const store = getPortalDemoStore();

  return Response.json({
    dashboards: store.dashboards,
    selectedDashboardId: store.selectedDashboardId
  });
}
