import { readPortalSessionFromCookieHeader } from "../../../../lib/portal/session";
import { createPortalBackendClient } from "../../../../lib/portal/backend-client";

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

  const workbooks = await createPortalBackendClient(session).listWorkbooks();
  return Response.json(workbooks);
}
