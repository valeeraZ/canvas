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
  const url = new URL(request.url);
  const columns = url.searchParams.get("columns");

  try {
    const payload = await createPortalBackendClient(session).getDatasetRowsPage({
      datasetId,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 10),
      columns: columns
        ?.split(",")
        .map((column) => column.trim())
        .filter(Boolean)
    });
    return jsonWithRequestId(payload, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
