import { readScopedPortalSession } from "../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../response";

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

  const body = (await request.json().catch(() => ({}))) as Parameters<
    ReturnType<typeof createPortalBackendClient>["importDashboard"]
  >[0];

  try {
    const payload = await createPortalBackendClient(session).importDashboard(body);
    return jsonWithRequestId(payload, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
