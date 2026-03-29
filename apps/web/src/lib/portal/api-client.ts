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
  selectApp: (input: { appName: string }) => Promise<{
    expiresIn: number;
    selectedApp: string;
    principal: {
      displayName: string;
      employeeId: string;
      roles: string[];
    };
  }>;
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
  exportDashboard: (input: {
    dashboardId: string;
  }) => Promise<{
    version: 1;
    dashboard: {
      name: string;
      workbookId: string | null;
    };
    shareSubjects: Array<{ type: "user" | "group" | "role"; id: string }>;
  }>;
  importDashboard: (input: {
    version: 1;
    dashboard: {
      name: string;
      workbookId: string | null;
    };
    shareSubjects: Array<{ type: "user" | "group" | "role"; id: string }>;
  }) => Promise<{
    id: string;
    tenantId: string;
    name: string;
    workbookId: string | null;
  }>;
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
    async selectApp(input) {
      const response = await fetch("/api/canvas/auth/select-app", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return response.json();
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
    },
    async exportDashboard(input) {
      const response = await fetch(
        `/api/canvas/dashboards/${input.dashboardId}/export`
      );
      return response.json();
    },
    async importDashboard(input) {
      const response = await fetch("/api/canvas/dashboards/import", {
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
