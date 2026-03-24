import {
  createCachedAuthorizationResolver,
  createMemoryExpiringStore
} from "../../../../../../../packages/auth/src";
import { exchangeHostAssertion } from "../../../../../../../apps/backend/src/modules/session/routes/exchange-session";
import { NextResponse } from "next/server";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../lib/portal/session";

const defaultMockContext = {
  displayName: "Local Dev",
  employeeId: "dev-1",
  roles: ["ADMIN"]
} as const;

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

  const session = await exchangeHostAssertion({
    authBaseUrl: process.env.AUTH_BASE_URL ?? "http://auth.local",
    token: body.token ?? "local-dev-token",
    appName: body.appName ?? "canvas",
    authorizationResolver: createCachedAuthorizationResolver({
      authBaseUrl: process.env.AUTH_BASE_URL ?? "http://auth.local",
      defaultMockContext: {
        displayName: body.mockContext?.displayName ?? defaultMockContext.displayName,
        employeeId: body.mockContext?.employeeId ?? defaultMockContext.employeeId,
        roles: body.mockContext?.roles ?? [...defaultMockContext.roles]
      },
      cache: createMemoryExpiringStore()
    }),
    mockContext: {
      displayName: body.mockContext?.displayName ?? defaultMockContext.displayName,
      employeeId: body.mockContext?.employeeId ?? defaultMockContext.employeeId,
      roles: body.mockContext?.roles ?? [...defaultMockContext.roles]
    }
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
