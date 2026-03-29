import { readPortalSessionFromCookieHeader } from "../../../../../lib/portal/session";
import { createPortalBackendClient } from "../../../../../lib/portal/backend-client";

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as Parameters<
    ReturnType<typeof createPortalBackendClient>["importDashboard"]
  >[0];

  const payload = await createPortalBackendClient(session).importDashboard(body);
  return Response.json(payload);
}
