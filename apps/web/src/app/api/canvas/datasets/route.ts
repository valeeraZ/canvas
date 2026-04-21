import { readScopedPortalSession } from "../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../lib/portal/backend-client";
import { scopePortalSession } from "../../../../lib/portal/app-scope";
import { createRouteRequestId, jsonWithRequestId } from "../response";

export async function POST(request: Request) {
  const requestId = createRouteRequestId();
  const body = (await request.json().catch(() => ({}))) as {
    appName?: string;
    filename?: string;
    name?: string;
    content?: string;
    contentType?: string;
    sizeBytes?: number;
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
    const result = await createPortalBackendClient(
      scopePortalSession(session, body.appName)
    ).createDatasetUpload({
      filename: body.filename ?? "dataset.csv",
      name: body.name ?? "Dataset Upload",
      content: body.content,
      contentType: body.contentType,
      sizeBytes: body.sizeBytes
    });

    return jsonWithRequestId(result, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}

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
    const datasets = await createPortalBackendClient(session).listDatasets();
    return jsonWithRequestId(datasets, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
