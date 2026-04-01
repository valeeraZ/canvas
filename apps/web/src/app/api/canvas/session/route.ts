import { NextResponse } from "next/server";
import {
  prependRecentValue,
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../lib/portal/session";
import {
  createPortalBackendErrorResponse,
  exchangePortalSession
} from "../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../response";

export async function GET() {
  return jsonWithRequestId({
    signedAssertion: "local-dev-assertion"
  });
}

export async function POST(request: Request) {
  const requestId = createRouteRequestId();
  const body = (await request.json().catch(() => ({}))) as {
    appName?: string;
    token?: string;
  };

  try {
    const session = await exchangePortalSession({
      token: body.token,
      appName: body.appName ?? "canvas"
    });

    const response = NextResponse.json(session, {
      headers: {
        "x-request-id": requestId
      }
    });
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
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
