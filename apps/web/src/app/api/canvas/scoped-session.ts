import { scopePortalSession } from "../../../lib/portal/app-scope";
import { readPortalSessionFromCookieHeader } from "../../../lib/portal/session";

export function readScopedPortalSession(request: Request) {
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  if (!session) {
    return null;
  }

  return scopePortalSession(
    session,
    request.headers.get("x-canvas-app-name")
  );
}
