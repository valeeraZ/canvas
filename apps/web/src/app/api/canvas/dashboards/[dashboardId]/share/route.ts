import { shareDashboard } from "../../../../../../../../backend/src/modules/dashboards/routes/share-dashboard";
import { getPortalDemoStore } from "../../../../../../lib/portal/demo-store";
import { readPortalSessionFromCookieHeader } from "../../../../../../lib/portal/session";

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
  const store = getPortalDemoStore();
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );

  const result = await shareDashboard({
    appId: session?.selectedApp ?? "canvas",
    dashboardId,
    subjects: (body.subjects ?? [])
      .filter((subject): subject is { type: "user" | "group" | "role"; id: string } =>
        Boolean(subject?.type && subject?.id)
      )
      .map((subject) => ({
        type: subject.type,
        id: subject.id
      })),
    replaceRules: async (input) => {
      store.shareRules[input.dashboardId] = input.rules.map((rule) => ({
        type: rule.subjectType,
        id: rule.subjectId
      }));

      return input.rules.map((rule, index) => ({
        ...rule,
        id: `rule_${index + 1}`
      }));
    }
  });

  return Response.json(result);
}
