import {
  getSelectedDashboard,
  setSelectedDashboard
} from "../../../../../../../backend/src/modules/dashboards/routes/set-selected-dashboard";
import { getPortalDemoStore } from "../../../../../lib/portal/demo-store";

export async function GET() {
  const store = getPortalDemoStore();

  const result = await getSelectedDashboard({
    appId: "canvas",
    externalUserId: "dev-1",
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

  const result = await setSelectedDashboard({
    appId: "canvas",
    externalUserId: "dev-1",
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
