import { NextResponse } from "next/server";
import { createPortalBackendClient } from "../../../../../lib/portal/backend-client";
import { readPortalSessionFromCookieHeader } from "../../../../../lib/portal/session";

export async function GET(request: Request) {
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

  const payload = await createPortalBackendClient(session).listAccessibleApps();
  return NextResponse.json(payload);
}
