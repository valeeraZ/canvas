import { readPortalSessionFromCookieHeader } from "../../../../../lib/portal/session";
import { createPortalBackendClient } from "../../../../../lib/portal/backend-client";

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

  const result = await createPortalBackendClient(session).getSelectedDashboard();

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    dashboardId?: string | null;
  };
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

  const result = await createPortalBackendClient(session).setSelectedDashboard(
    body.dashboardId ?? null
  );

  return Response.json(result);
}
