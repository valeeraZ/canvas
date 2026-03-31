import { NextResponse } from "next/server";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE,
  readPortalSessionFromCookieHeader
} from "../../../../../lib/portal/session";
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

  const response = NextResponse.json(result);
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: encodePortalSession({
      ...session,
      recentApps: session.recentApps ?? [session.selectedApp],
      recentDashboardsByApp: result.dashboardId
        ? {
            ...(session.recentDashboardsByApp ?? {}),
            [session.selectedApp]: result.dashboardId
          }
        : session.recentDashboardsByApp ?? {},
      recentWorkbooksByApp: session.recentWorkbooksByApp ?? {}
    }),
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return response;
}
