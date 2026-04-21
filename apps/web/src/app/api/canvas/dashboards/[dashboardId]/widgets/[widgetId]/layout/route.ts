import { readScopedPortalSession } from "../../../../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../../../../response";

type RouteContext = {
  params: Promise<{
    dashboardId: string;
    widgetId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      { message: "Missing portal session" },
      { status: 401, requestId }
    );
  }

  const { dashboardId, widgetId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  try {
    const widget = await createPortalBackendClient(session).updateDashboardWidgetLayout({
      dashboardId,
      widgetId,
      layout: body
    });
    return jsonWithRequestId(widget, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
