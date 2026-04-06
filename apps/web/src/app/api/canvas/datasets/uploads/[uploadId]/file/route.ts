import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../../../lib/portal/backend-client";
import { readPortalSessionFromCookieHeader } from "../../../../../../../lib/portal/session";
import { createRouteRequestId, jsonWithRequestId } from "../../../../response";

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      uploadId: string;
    }>;
  }
) {
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

  const { uploadId } = await context.params;

  if (!request.body) {
    return jsonWithRequestId(
      {
        message: "Missing file body"
      },
      {
        status: 400,
        requestId
      }
    );
  }

  try {
    const result = await createPortalBackendClient(session).uploadDatasetFile({
      uploadId,
      body: request.body,
      contentType:
        request.headers.get("content-type") ?? "application/octet-stream"
    });

    return jsonWithRequestId(result, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
