import { readScopedPortalSession } from "../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../response";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      datasetId: string;
    }>;
  }
) {
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
    const { datasetId } = await context.params;
    const dataset = await createPortalBackendClient(session).getDataset(datasetId);
    return jsonWithRequestId(dataset, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
