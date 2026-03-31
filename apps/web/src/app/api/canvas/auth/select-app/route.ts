import { NextResponse } from "next/server";
import { createPortalBackendClient } from "../../../../../lib/portal/backend-client";
import {
  prependRecentValue,
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

  const nextApp = await createPortalBackendClient(session).selectApp(
    body.appName ?? session.selectedApp
  );
  const nextSession = {
    expiresIn: 1800,
    selectedApp: nextApp.tenantId,
    principal: {
      ...session.principal,
      roles: nextApp.roles
    }
  };

  const response = NextResponse.json(nextSession);
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: encodePortalSession({
      token: session.token,
      selectedApp: nextSession.selectedApp,
      recentApps: prependRecentValue(session.recentApps ?? [], nextSession.selectedApp),
      recentDashboardsByApp: session.recentDashboardsByApp ?? {},
      recentWorkbooksByApp: session.recentWorkbooksByApp ?? {},
      principal: nextSession.principal
    }),
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return response;
}
