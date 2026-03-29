import {
  readPortalSessionFromCookieHeader
} from "../../../../lib/portal/session";
import { createPortalBackendClient } from "../../../../lib/portal/backend-client";

export async function GET(request: Request) {
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  if (!session) {
    return Response.json(
      {
        message: "Missing portal session"
      },
      {
        status: 401
      }
    );
  }

  const client = createPortalBackendClient(session);
  const [dashboards, selected] = await Promise.all([
    client.listDashboards(),
    client.getSelectedDashboard()
  ]);

  return Response.json({
    dashboards: dashboards.map((dashboard) => ({
      id: dashboard.id,
      name: dashboard.name
    })),
    selectedDashboardId: selected.dashboardId
  });
}
