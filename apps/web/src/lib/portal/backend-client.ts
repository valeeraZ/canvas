import type { PortalSession } from "./session";
import type {
  ChartPayload,
  ChartQueryRequest
} from "../../../../../packages/contracts/src/charts.js";
import type { DashboardExportPackage } from "../../../../../packages/contracts/src/dashboard-portability.js";
import type { ChartWidgetConfig, DatasetPreview } from "../../../../../packages/contracts/src/dashboard-editor.js";
import type { DashboardWidgetRecord } from "../../../../../packages/contracts/src/widgets.js";

const PUBLIC_PORTAL_ERROR_MESSAGE = "Request failed";

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

export class PortalBackendError extends Error {
  status: number;
  requestId?: string;

  constructor(input: { message: string; status: number; requestId?: string }) {
    super(input.message);
    this.name = "PortalBackendError";
    this.status = input.status;
    this.requestId = input.requestId;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const responseRequestId = response.headers.get("x-request-id") ?? undefined;
  let payload:
    | {
        message?: string;
        requestId?: string;
      }
    | undefined;

  if (text) {
    try {
      payload = JSON.parse(text) as {
        message?: string;
        requestId?: string;
      };
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    throw new PortalBackendError({
      message:
        payload?.message ||
        text ||
        `Backend request failed: ${response.status}`,
      status: response.status,
      requestId: payload?.requestId || responseRequestId
    });
  }

  if (!text) {
    throw new PortalBackendError({
      message: "Backend returned an empty response body",
      status: 502,
      requestId: responseRequestId
    });
  }

  if (payload !== undefined) {
    return payload as T;
  }

  throw new PortalBackendError({
    message: "Backend returned invalid JSON",
    status: 502,
    requestId: responseRequestId
  });
}

export function createPortalBackendErrorResponse(
  error: unknown,
  fallbackRequestId?: string
) {
  if (error instanceof PortalBackendError) {
    const headers = new Headers();

    const requestId = error.requestId ?? fallbackRequestId;

    if (requestId) {
      headers.set("x-request-id", requestId);
    }

    return Response.json(
      {
        message: PUBLIC_PORTAL_ERROR_MESSAGE,
        ...(requestId ? { requestId } : {})
      },
      {
        status: error.status,
        headers
      }
    );
  }

  return Response.json(
    {
      message: PUBLIC_PORTAL_ERROR_MESSAGE,
      ...(fallbackRequestId ? { requestId: fallbackRequestId } : {})
    },
    {
      status: 500,
      headers: fallbackRequestId
        ? {
            "x-request-id": fallbackRequestId
          }
        : undefined
    }
  );
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
    async createDashboard(input: { name: string; workbookId?: string | null }) {
      const response = await authorizedFetch("/dashboards", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          workbookId: input.workbookId ?? undefined
        })
      });
      return readJson<{
        id: string;
        tenantId: string;
        name: string;
        workbookId: string | null;
      }>(response);
    },
    async getDashboard(dashboardId: string) {
      const response = await authorizedFetch(`/dashboards/${dashboardId}`);
      return readJson<{ id: string; tenantId: string; name: string; workbookId: string | null }>(response);
    },
    async listDashboardWidgets(dashboardId: string) {
      const response = await authorizedFetch(`/dashboards/${dashboardId}/widgets`);
      return readJson<DashboardWidgetRecord[]>(response);
    },
    async createDashboardWidget(input: {
      dashboardId: string;
      type: DashboardWidgetRecord["type"];
      datasetId?: string | null;
      config?: ChartWidgetConfig | null;
    }) {
      const response = await authorizedFetch(`/dashboards/${input.dashboardId}/widgets`, {
        method: "POST",
        body: JSON.stringify({
          type: input.type,
          datasetId: input.datasetId ?? null,
          config: input.config ?? null
        })
      });

      return readJson<DashboardWidgetRecord>(response);
    },
    async updateDashboardWidget(input: {
      dashboardId: string;
      widgetId: string;
      config: ChartWidgetConfig;
    }) {
      const response = await authorizedFetch(
        `/dashboards/${input.dashboardId}/widgets/${input.widgetId}`,
        {
          method: "PATCH",
          body: JSON.stringify(input.config)
        }
      );

      return readJson<DashboardWidgetRecord>(response);
    },
    async updateDashboardWidgetLayout(input: {
      dashboardId: string;
      widgetId: string;
      layout: DashboardWidgetRecord["layout"];
    }) {
      const response = await authorizedFetch(
        `/dashboards/${input.dashboardId}/widgets/${input.widgetId}/layout`,
        {
          method: "PATCH",
          body: JSON.stringify(input.layout)
        }
      );

      return readJson<DashboardWidgetRecord>(response);
    },
    async deleteDashboardWidget(input: {
      dashboardId: string;
      widgetId: string;
    }) {
      const response = await authorizedFetch(
        `/dashboards/${input.dashboardId}/widgets/${input.widgetId}`,
        {
          method: "DELETE"
        }
      );

      return readJson<{
        deletedWidgetId: string;
        widgets: DashboardWidgetRecord[];
      }>(response);
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
    async getDataset(datasetId: string) {
      const response = await authorizedFetch(`/datasets/${datasetId}`);
      return readJson<{
        id: string;
        name: string;
        status: string;
        warnings: Array<{ code: string; message?: string }>;
        uploadedByExternalUserId?: string;
        uploadedByDisplayName?: string;
        uploadedAt?: string;
        sourceFilename?: string;
        contentType?: string;
        sizeBytes?: number;
        storageBucket?: string;
        storageObjectKey?: string;
        storageUploadId?: string;
        importStatus?: string;
        usageSummary: {
          dashboards: Array<{ id: string; name: string }>;
          widgets: Array<{
            id: string;
            dashboardId: string;
            dashboardName: string;
            type: string;
          }>;
          workbooks: Array<{ id: string; name: string }>;
        };
      }>(response);
    },
    async createDatasetUpload(input: {
      filename: string;
      name: string;
      content?: string;
      contentType?: string;
      sizeBytes?: number;
    }) {
      const response = await authorizedFetch("/datasets/uploads", {
        method: "POST",
        body: JSON.stringify(input)
      });
      return readJson<{
        uploadId: string;
        upload: { bucket: string; objectKey: string; uploadUrl: string };
        dataset: {
          id: string;
          name: string;
          status: string;
          warningCount: number;
        };
      }>(response);
    },
    async uploadDatasetFile(input: {
      uploadId: string;
      body: ReadableStream<Uint8Array>;
      contentType?: string;
    }) {
      const backendSessionCookie = await getBackendSessionCookie();
      const headers = new Headers({
        authorization: `Bearer ${session.token}`,
        cookie: backendSessionCookie
      });

      if (input.contentType) {
        headers.set("content-type", input.contentType);
      }

      const response = await fetch(
        `${baseUrl}/datasets/uploads/${input.uploadId}/file`,
        {
          method: "PUT",
          headers,
          body: input.body,
          duplex: "half"
        } as RequestInit & { duplex: "half" }
      );

      return readJson<{
        uploadId: string;
        datasetId: string;
        bucket: string;
        objectKey: string;
        sizeBytes: number;
        importStatus: string;
      }>(response);
    },
    async getDatasetPreview(datasetId: string) {
      const response = await authorizedFetch(`/datasets/${datasetId}/preview`);
      return readJson<DatasetPreview>(response);
    },
    async runDatasetChartQuery(input: ChartQueryRequest) {
      const response = await authorizedFetch(
        `/datasets/${input.datasetId}/chart-query`,
        {
          method: "POST",
          body: JSON.stringify({
            chartType: input.chartType,
            xField: input.xField,
            yField: input.yField
          })
        }
      );
      return readJson<ChartPayload>(response);
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
    async getWorkbook(workbookId: string) {
      const response = await authorizedFetch(`/workbooks/${workbookId}`);
      return readJson<{
        id: string;
        tenantId: string;
        name: string;
      }>(response);
    },
    async createWorkbook(input: { name: string }) {
      const response = await authorizedFetch("/workbooks", {
        method: "POST",
        body: JSON.stringify(input)
      });
      return readJson<{
        id: string;
        tenantId: string;
        name: string;
      }>(response);
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
