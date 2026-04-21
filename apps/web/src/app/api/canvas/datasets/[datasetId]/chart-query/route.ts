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

export async function POST(request: Request, context: RouteContext) {
  const requestId = createRouteRequestId();
  const session = readScopedPortalSession(request);

  if (!session) {
    return jsonWithRequestId(
      { message: "Missing portal session" },
      { status: 401, requestId }
    );
  }

  const { datasetId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    chartType?: "bar" | "line" | "area";
    xField?: string;
    yField?: string;
  };

  try {
    const payload = await createPortalBackendClient(session).runDatasetChartQuery({
      datasetId,
      chartType: body.chartType ?? "bar",
      xField: body.xField ?? "",
      yField: body.yField ?? ""
    });
    return jsonWithRequestId(payload, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
