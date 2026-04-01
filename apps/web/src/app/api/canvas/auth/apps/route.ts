import { NextResponse } from "next/server";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../lib/portal/backend-client";
import { readPortalSessionFromCookieHeader } from "../../../../../lib/portal/session";
import { createRouteRequestId, jsonWithRequestId } from "../../response";

export async function GET(request: Request) {
  const requestId = createRouteRequestId();
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

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
    const payload = await createPortalBackendClient(session).listAccessibleApps();
    return NextResponse.json(payload, {
      headers: {
        "x-request-id": requestId
      }
    });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
