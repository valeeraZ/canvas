export type PortalApiClient = {
  createSession: (input: {
    token: string;
    appName: string;
  }) => Promise<{
    expiresIn: number;
    selectedApp: string;
    principal: {
      displayName: string;
      employeeId: string;
      roles: string[];
    };
  }>;
  listApps: () => Promise<string[]>;
  listDashboards: () => Promise<{
    dashboards: Array<{ id: string; name: string }>;
    selectedDashboardId: string | null;
  }>;
  shareDashboard: (input: {
    dashboardId: string;
    subjects: Array<{ type: "user" | "group" | "role"; id: string }>;
  }) => Promise<unknown>;
  getSelectedDashboard: () => Promise<{ dashboardId: string | null }>;
  setSelectedDashboard: (input: {
    dashboardId: string | null;
  }) => Promise<{ dashboardId: string | null }>;
};

export function createPortalApiClient(): PortalApiClient {
  return {
    async createSession(input) {
      const response = await fetch("/api/canvas/session", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return response.json();
    },
    async listApps() {
      return ["canvas", "canvas-ops"];
    },
    async listDashboards() {
      const response = await fetch("/api/canvas/dashboards");
      return response.json();
    },
    async shareDashboard(input) {
      const response = await fetch(
        `/api/canvas/dashboards/${input.dashboardId}/share`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            subjects: input.subjects
          })
        }
      );

      return response.json();
    },
    async getSelectedDashboard() {
      const response = await fetch("/api/canvas/dashboards/selected-dashboard");
      return response.json();
    },
    async setSelectedDashboard(input) {
      const response = await fetch("/api/canvas/dashboards/selected-dashboard", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return response.json();
    }
  };
}
