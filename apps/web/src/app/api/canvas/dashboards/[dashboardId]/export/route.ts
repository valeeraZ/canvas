import { readScopedPortalSession } from "../../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../../response";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      dashboardId: string;
    }>;
  }
) {
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
    const { dashboardId } = await context.params;
    const payload = await createPortalBackendClient(session).exportDashboard(dashboardId);
    return jsonWithRequestId(payload, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
