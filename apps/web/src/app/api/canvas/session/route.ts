import { exchangeHostAssertion } from "../../../../../../../apps/backend/src/modules/session/routes/exchange-session";

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
    mockContext: {
      displayName: body.mockContext?.displayName ?? defaultMockContext.displayName,
      employeeId: body.mockContext?.employeeId ?? defaultMockContext.employeeId,
      roles: body.mockContext?.roles ?? [...defaultMockContext.roles]
    }
  });

  return Response.json(session);
}
