import { NextResponse } from "next/server";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../lib/portal/session";
import { resolvePortalSession } from "../../../../lib/portal/resolve-session";

export async function GET() {
  return Response.json({
    signedAssertion: "local-dev-assertion"
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    appName?: string;
    token?: string;
    mockContext?: {
      displayName?: string;
      employeeId?: string;
      roles?: string[];
    };
  };

  const session = await resolvePortalSession({
    token: body.token,
    appName: body.appName ?? "canvas",
    mockContext: body.mockContext
  });

  const response = NextResponse.json(session);
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: encodePortalSession({
      token: body.token ?? "local-dev-token",
      selectedApp: session.selectedApp,
      principal: session.principal
    }),
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return response;
}
