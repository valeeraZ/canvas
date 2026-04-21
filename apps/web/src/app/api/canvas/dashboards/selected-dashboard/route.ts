import { readScopedPortalSession } from "../../scoped-session";
import { NextResponse } from "next/server";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE,
} from "../../../../../lib/portal/session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../response";

export async function GET(request: Request) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      {
        message: "Missing portal session"
      },
      {
        status: 401,
        requestId
      }
    );
  }

  try {
    const result = await createPortalBackendClient(session).getSelectedDashboard();

    return jsonWithRequestId(result, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = createRouteRequestId();
  const body = (await request.json().catch(() => ({}))) as {
    dashboardId?: string | null;
  };
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      {
        message: "Missing portal session"
      },
      {
        status: 401,
        requestId
      }
    );
  }

  try {
    const result = await createPortalBackendClient(session).setSelectedDashboard(
      body.dashboardId ?? null
    );

    const response = NextResponse.json(result, {
      headers: {
        "x-request-id": requestId
      }
    });
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
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
