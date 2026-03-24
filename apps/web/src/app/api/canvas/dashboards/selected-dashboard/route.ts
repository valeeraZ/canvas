import {
  getSelectedDashboard,
  setSelectedDashboard
} from "../../../../../../../backend/src/modules/dashboards/routes/set-selected-dashboard";
import { getPortalDemoStore } from "../../../../../lib/portal/demo-store";
import { readPortalSessionFromCookieHeader } from "../../../../../lib/portal/session";

export async function GET(request: Request) {
  const store = getPortalDemoStore();
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );
  const appId = session?.selectedApp ?? "canvas";
  const externalUserId = session?.principal.employeeId ?? "dev-1";

  const result = await getSelectedDashboard({
    appId,
    externalUserId,
    findPrincipalByExternalUserId: async (externalUserId: string) => ({
      id: externalUserId,
      externalUserId
    }),
    getPreference: async (input) => ({
      selectedDashboardId:
        input.principalId === "dev-1" ? store.selectedDashboardId : null
    })
  });

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    dashboardId?: string | null;
  };
  const store = getPortalDemoStore();
  const session = readPortalSessionFromCookieHeader(
    request.headers.get("cookie") ?? ""
  );
  const appId = session?.selectedApp ?? "canvas";
  const externalUserId = session?.principal.employeeId ?? "dev-1";

  const result = await setSelectedDashboard({
    appId,
    externalUserId,
    dashboardId: body.dashboardId ?? null,
    upsertPrincipal: async ({ externalUserId }) => ({
      id: externalUserId,
      externalUserId
    }),
    setPreference: async (input) => {
      store.selectedDashboardId = input.selectedDashboardId;
      return {
        selectedDashboardId: input.selectedDashboardId
      };
    }
  });

  return Response.json(result);
}
