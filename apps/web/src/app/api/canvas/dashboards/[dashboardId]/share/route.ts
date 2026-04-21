import { readScopedPortalSession } from "../../../scoped-session";
import {
  createPortalBackendClient,
  createPortalBackendErrorResponse
} from "../../../../../../lib/portal/backend-client";
import { createRouteRequestId, jsonWithRequestId } from "../../../response";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      dashboardId: string;
    }>;
  }
) {
  const requestId = createRouteRequestId();
  const body = (await request.json().catch(() => ({}))) as {
    subjects?: Array<{
      type?: "user" | "group" | "role";
      id?: string;
    }>;
  };

  const { dashboardId } = await context.params;
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
    const result = await createPortalBackendClient(session).shareDashboard({
      dashboardId,
      subjects: (body.subjects ?? [])
        .filter((subject): subject is { type: "user" | "group" | "role"; id: string } =>
          Boolean(subject?.type && subject?.id)
        )
        .map((subject) => ({
          type: subject.type,
          id: subject.id
        }))
    });

    return jsonWithRequestId(result, { requestId });
  } catch (error) {
    return createPortalBackendErrorResponse(error, requestId);
  }
}
