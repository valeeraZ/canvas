type DemoDashboard = {
  id: string;
  name: string;
};

type DemoShareSubject = {
  type: "user" | "group" | "role";
  id: string;
};

type PortalDemoStore = {
  dashboards: DemoDashboard[];
  shareRules: Record<string, DemoShareSubject[]>;
  selectedDashboardId: string | null;
};

declare global {
  var __canvasPortalDemoStore: PortalDemoStore | undefined;
}

export function getPortalDemoStore(): PortalDemoStore {
  if (!globalThis.__canvasPortalDemoStore) {
    globalThis.__canvasPortalDemoStore = {
      dashboards: [
        {
          id: "dash_1",
          name: "Executive Overview"
        },
        {
          id: "dash_2",
          name: "Finance Drilldown"
        }
      ],
      shareRules: {
        dash_1: [{ type: "role", id: "ADMIN" }],
        dash_2: [{ type: "group", id: "finance" }]
      },
      selectedDashboardId: "dash_1"
    };
  }

  return globalThis.__canvasPortalDemoStore;
}
