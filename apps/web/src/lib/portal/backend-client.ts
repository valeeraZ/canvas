import type { PortalSession } from "./session";
import type { DashboardExportPackage } from "../../../../../packages/contracts/src/dashboard-portability.js";

function getBackendBaseUrl() {
  return (process.env.CANVAS_BACKEND_BASE_URL ?? "http://127.0.0.1:3001").replace(
    /\/$/,
    ""
  );
}

function readSessionCookie(value: string | null) {
  if (!value) {
    throw new Error("Backend session exchange did not return a session cookie");
  }

  return value.split(";")[0] ?? value;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Backend request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function exchangePortalSession(input: {
  token?: string;
  appName: string;
}) {
  const response = await fetch(`${getBackendBaseUrl()}/session/exchange`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      token: input.token,
      appName: input.appName
    })
  });

  return readJson<{
    expiresIn: number;
    selectedApp: string;
    principal: {
      displayName: string;
      employeeId: string;
      roles: string[];
    };
  }>(response);
}

export function createPortalBackendClient(session: PortalSession) {
  const baseUrl = getBackendBaseUrl();
  let backendSessionCookiePromise: Promise<string> | null = null;

  async function getBackendSessionCookie() {
    if (!backendSessionCookiePromise) {
      backendSessionCookiePromise = (async () => {
        const response = await fetch(`${baseUrl}/session/exchange`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            token: session.token,
            appName: session.selectedApp
          })
        });

        await readJson(response);
        return readSessionCookie(response.headers.get("set-cookie"));
      })();
    }

    return backendSessionCookiePromise;
  }

  async function authorizedFetch(path: string, init: RequestInit = {}) {
    const backendSessionCookie = await getBackendSessionCookie();
    const headers = new Headers(init.headers);

    headers.set("authorization", `Bearer ${session.token}`);
    headers.set("cookie", backendSessionCookie);

    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers
    });
  }

  return {
    async listAccessibleApps() {
      const response = await fetch(`${baseUrl}/auth/apps`, {
        headers: {
          authorization: `Bearer ${session.token}`
        }
      });

      return readJson<{
        principal: {
          displayName: string;
          employeeId: string;
        };
        apps: Array<{
          appName: string;
          roles: string[];
        }>;
      }>(response);
    },
    async listDashboards() {
      const response = await authorizedFetch("/dashboards");
      return readJson<Array<{ id: string; tenantId: string; name: string; workbookId: string | null }>>(response);
    },
    async getDashboard(dashboardId: string) {
      const response = await authorizedFetch(`/dashboards/${dashboardId}`);
      return readJson<{ id: string; tenantId: string; name: string; workbookId: string | null }>(response);
    },
    async getDashboardShare(dashboardId: string) {
      const response = await authorizedFetch(`/dashboards/${dashboardId}/share`);
      return readJson<{
        dashboardId: string;
        subjects: Array<{ type: "user" | "group" | "role"; id: string }>;
        rules: Array<{
          id?: string;
          dashboardId: string;
          appId: string;
          subjectType: "user" | "group" | "role";
          subjectId: string;
        }>;
      }>(response);
    },
    async getSelectedDashboard() {
      const response = await authorizedFetch("/dashboards/selected-dashboard");
      return readJson<{ dashboardId: string | null }>(response);
    },
    async setSelectedDashboard(dashboardId: string | null) {
      const response = await authorizedFetch("/dashboards/selected-dashboard", {
        method: "POST",
        body: JSON.stringify({ dashboardId })
      });
      return readJson<{ dashboardId: string | null }>(response);
    },
    async shareDashboard(input: {
      dashboardId: string;
      subjects: Array<{ type: "user" | "group" | "role"; id: string }>;
    }) {
      const response = await authorizedFetch(`/dashboards/${input.dashboardId}/share`, {
        method: "POST",
        body: JSON.stringify({
          subjects: input.subjects
        })
      });

      return readJson<{
        dashboardId: string;
        subjects: Array<{ type: "user" | "group" | "role"; id: string }>;
        rules: Array<{ subjectId: string }>;
      }>(response);
    },
    async exportDashboard(dashboardId: string) {
      const response = await authorizedFetch(`/dashboards/${dashboardId}/export`);
      return readJson<DashboardExportPackage>(response);
    },
    async importDashboard(pkg: DashboardExportPackage) {
      const response = await authorizedFetch("/dashboards/import", {
        method: "POST",
        body: JSON.stringify(pkg)
      });
      return readJson<{
        id: string;
        tenantId: string;
        name: string;
        workbookId: string | null;
      }>(response);
    },
    async listDatasets() {
      const response = await authorizedFetch("/datasets");
      return readJson<
        Array<{
          id: string;
          name: string;
          status: string;
          warningCount: number;
        }>
      >(response);
    },
    async createDatasetUpload(input: { filename: string; name: string }) {
      const response = await authorizedFetch("/datasets/uploads", {
        method: "POST",
        body: JSON.stringify(input)
      });
      return readJson<{
        upload: { bucket: string; objectKey: string };
        dataset: {
          id: string;
          name: string;
          status: string;
          warningCount: number;
        };
      }>(response);
    },
    async listWorkbooks() {
      const response = await authorizedFetch("/workbooks");
      return readJson<
        Array<{
          id: string;
          tenantId: string;
          name: string;
        }>
      >(response);
    },
    async selectApp(appName: string) {
      const response = await authorizedFetch("/auth/select-app", {
        method: "POST",
        body: JSON.stringify({
          appName
        })
      });

      return readJson<{
        tenantId: string;
        roles: string[];
      }>(response);
    }
  };
}
