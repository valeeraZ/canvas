import { readScopedPortalSession } from "../../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../../response";

type RouteContext = {
  params: Promise<{
    dashboardId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      { message: "Missing portal session" },
      { status: 401, requestId }
    );
  }

  const { dashboardId } = await context.params;

  try {
    const widgets = await createPortalBackendClient(session).listDashboardWidgets(
      dashboardId
    );
    return jsonWithRequestId(widgets, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      { message: "Missing portal session" },
      { status: 401, requestId }
    );
  }

  const { dashboardId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    type?: "chart" | "table" | "metric" | "text";
    datasetId?: string | null;
    config?: {
      datasetId: string;
      chartType: "bar" | "line" | "area" | "pie";
      xField: string;
      yField: string;
      seriesField?: string;
      title?: string;
    } | null;
  };

  try {
    const widget = await createPortalBackendClient(session).createDashboardWidget({
      dashboardId,
      type: body.type ?? "chart",
      datasetId: body.datasetId ?? null,
      config: body.config ?? null
    });
    return jsonWithRequestId(widget, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
