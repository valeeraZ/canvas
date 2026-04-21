import { readScopedPortalSession } from "../../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../../response";

type RouteContext = {
  params: Promise<{
    datasetId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      { message: "Missing portal session" },
      { status: 401, requestId }
    );
  }

  const { datasetId } = await context.params;

  try {
    const preview = await createPortalBackendClient(session).getDatasetPreview(
      datasetId
    );
    return jsonWithRequestId(preview, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
