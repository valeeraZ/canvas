import { NextResponse } from "next/server";
import { resolvePortalSession } from "../../../../../lib/portal/resolve-session";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE,
  readPortalSessionFromCookieHeader
} from "../../../../../lib/portal/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    appName?: string;
  };
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  if (!session) {
    return NextResponse.json(
      {
        message: "Missing portal session"
      },
      {
        status: 401
      }
    );
  }

  const nextSession = await resolvePortalSession({
    token: session.token,
    appName: body.appName ?? session.selectedApp,
    mockContext: {
      displayName: session.principal.displayName,
      employeeId: session.principal.employeeId,
      roles: session.principal.roles
    }
  });

  const response = NextResponse.json(nextSession);
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: encodePortalSession({
      token: session.token,
      selectedApp: nextSession.selectedApp,
      principal: nextSession.principal
    }),
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return response;
}
