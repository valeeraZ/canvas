import { readPortalSessionFromCookieHeader } from "../../../../../../lib/portal/session";
import { createPortalBackendClient } from "../../../../../../lib/portal/backend-client";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      dashboardId: string;
    }>;
  }
) {
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

  const { dashboardId } = await context.params;
  const payload = await createPortalBackendClient(session).exportDashboard(dashboardId);
  return Response.json(payload);
}
