import { readScopedPortalSession } from "../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../response";

export async function GET(request: Request) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      {
        message: "Missing portal session"
      },
      {
        status: 401,
        requestId
      }
    );
  }

  try {
    const client = createPortalBackendClient(session);
    const [dashboards, selected] = await Promise.all([
      client.listDashboards(),
      client.getSelectedDashboard()
    ]);

    return jsonWithRequestId({
      dashboards,
      selectedDashboardId: selected.dashboardId
    }, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      {
        message: "Missing portal session"
      },
      {
        status: 401,
        requestId
      }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    workbookId?: string | null;
  };

  try {
    const dashboard = await createPortalBackendClient(session).createDashboard({
      name: body.name ?? "Untitled Dashboard",
      workbookId: body.workbookId ?? null
    });

    return jsonWithRequestId(dashboard, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
