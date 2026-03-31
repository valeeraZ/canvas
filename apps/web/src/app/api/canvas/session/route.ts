import { NextResponse } from "next/server";
import {
  prependRecentValue,
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../lib/portal/session";
import { exchangePortalSession } from "../../../../lib/portal/backend-client";

export async function GET() {
  return Response.json({
    signedAssertion: "local-dev-assertion"
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    appName?: string;
    token?: string;
  };

  const session = await exchangePortalSession({
    token: body.token,
    appName: body.appName ?? "canvas"
  });

  const response = NextResponse.json(session);
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: encodePortalSession({
      token: body.token ?? "local-dev-token",
      selectedApp: session.selectedApp,
      recentApps: prependRecentValue([], session.selectedApp),
      recentDashboardsByApp: {},
      recentWorkbooksByApp: {},
      principal: session.principal
    }),
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return response;
}
