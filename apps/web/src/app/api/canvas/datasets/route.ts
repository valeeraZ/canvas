import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../lib/portal/backend-client";
import { readPortalSessionFromCookieHeader } from "../../../../lib/portal/session";
import { createRouteRequestId, jsonWithRequestId } from "../response";

export async function POST(request: Request) {
  const requestId = createRouteRequestId();
  const body = (await request.json().catch(() => ({}))) as {
    filename?: string;
    name?: string;
  };
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
    const result = await createPortalBackendClient(session).createDatasetUpload({
      filename: body.filename ?? "dataset.csv",
      name: body.name ?? "Dataset Upload"
    });

    return jsonWithRequestId(result, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}

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
    const datasets = await createPortalBackendClient(session).listDatasets();
    return jsonWithRequestId(datasets, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
