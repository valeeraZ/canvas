import { readPortalSessionFromCookieHeader } from "../../../../../../lib/portal/session";
import { createPortalBackendClient } from "../../../../../../lib/portal/backend-client";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      dashboardId: string;
    }>;
  }
) {
  const body = (await request.json().catch(() => ({}))) as {
    subjects?: Array<{
      type?: "user" | "group" | "role";
      id?: string;
    }>;
  };

  const { dashboardId } = await context.params;
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  if (!session) {
    return Response.json(
      {
        message: "Missing portal session"
      },
      {
        status: 401
      }
    );
  }

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

  return Response.json(result);
}
