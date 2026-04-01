import { readPortalSessionFromCookieHeader } from "../../../../lib/portal/session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../response";

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
    const workbooks = await createPortalBackendClient(session).listWorkbooks();
    return jsonWithRequestId(workbooks, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
  };
  try {
    const workbook = await createPortalBackendClient(session).createWorkbook({
      name: body.name ?? "Untitled Workbook"
    });

    return jsonWithRequestId(workbook, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
