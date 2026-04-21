import { readScopedPortalSession } from "../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../response";

type RouteContext = {
  params: Promise<{
    dashboardId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

  const { dashboardId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
  };

  try {
    const dashboard = await createPortalBackendClient(session).renameDashboard({
      dashboardId,
      name: body.name ?? ""
    });

    return jsonWithRequestId(dashboard, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

  const { dashboardId } = await context.params;

  try {
    const result = await createPortalBackendClient(session).removeDashboard(
      dashboardId
    );

    return jsonWithRequestId(result, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
