import { readPortalSessionFromCookieHeader } from "../../../../../../../lib/portal/session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../../../response";

type RouteContext = {
  params: Promise<{
    dashboardId: string;
    widgetId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = createRouteRequestId();
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  if (!session) {
    return jsonWithRequestId(
      { message: "Missing portal session" },
      { status: 401, requestId }
    );
  }

  const { dashboardId, widgetId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    datasetId: string;
    chartType: "bar" | "line" | "area" | "pie";
    xField: string;
    yField: string;
    seriesField?: string;
    title?: string;
  };

  try {
    const widget = await createPortalBackendClient(session).updateDashboardWidget({
      dashboardId,
      widgetId,
      config: body
    });
    return jsonWithRequestId(widget, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
