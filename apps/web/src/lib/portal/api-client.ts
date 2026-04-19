import type { DashboardWidgetRecord } from "../../../../../packages/contracts/src/widgets.js";

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
  createDashboard: (input: {
    name: string;
    workbookId?: string | null;
  }) => Promise<{
    id: string;
    tenantId: string;
    name: string;
    workbookId: string | null;
  }>;
  listDashboardWidgets: (dashboardId: string) => Promise<DashboardWidgetRecord[]>;
  createDashboardWidget: (input: {
    dashboardId: string;
    type: "chart" | "table" | "metric" | "text";
    datasetId?: string | null;
    config?: {
      datasetId: string;
      chartType: "bar" | "line" | "area" | "pie";
      xField: string;
      yField: string;
      seriesField?: string;
      title?: string;
    } | null;
  }) => Promise<DashboardWidgetRecord>;
  updateDashboardWidget: (input: {
    dashboardId: string;
    widgetId: string;
    config: {
      datasetId: string;
      chartType: "bar" | "line" | "area" | "pie";
      xField: string;
      yField: string;
      seriesField?: string;
      title?: string;
    };
  }) => Promise<DashboardWidgetRecord>;
  updateDashboardWidgetLayout: (input: {
    dashboardId: string;
    widgetId: string;
    layout: DashboardWidgetRecord["layout"];
  }) => Promise<DashboardWidgetRecord>;
  deleteDashboardWidget: (input: {
    dashboardId: string;
    widgetId: string;
  }) => Promise<{
    deletedWidgetId: string;
    widgets: DashboardWidgetRecord[];
  }>;
  getDatasetPreview: (datasetId: string) => Promise<{
    datasetId: string;
    columns: Array<{
      name: string;
      type: "string" | "number" | "boolean" | "date" | "unknown";
    }>;
    sampleRows: Array<Record<string, string | number | boolean | null>>;
    records: Array<Record<string, string | number | boolean | null>>;
  }>;
  runDatasetChartQuery: (input: {
    datasetId: string;
    chartType: "bar" | "line" | "area";
    xField: string;
    yField: string;
  }) => Promise<{
    chartType: "bar" | "line" | "area";
    labels: string[];
    series: Array<{ name: string; data: number[] }>;
  }>;
  getDataset: (datasetId: string) => Promise<{
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
  }>;
  createDatasetUpload: (input: {
    filename: string;
    name: string;
    content?: string;
    contentType?: string;
    sizeBytes?: number;
  }) => Promise<{
    uploadId: string;
    upload: {
      bucket: string;
      objectKey: string;
      uploadUrl: string;
    };
    dataset: {
      id: string;
      name: string;
      status: string;
      warningCount: number;
    };
  }>;
  uploadDatasetFile: (input: {
    uploadId: string;
    file: File;
  }) => Promise<{
    uploadId: string;
    datasetId: string;
    bucket: string;
    objectKey: string;
    sizeBytes: number;
    importStatus: string;
  }>;
  createWorkbook: (input: {
    name: string;
  }) => Promise<{
    id: string;
    tenantId: string;
    name: string;
  }>;
};

const PUBLIC_PORTAL_API_MESSAGE = "Request failed";

export class PortalApiError extends Error {
  requestId?: string;
  status?: number;

  constructor(input: {
    message: string;
    requestId?: string;
    status?: number;
  }) {
    super(input.message);
    this.name = "PortalApiError";
    this.requestId = input.requestId;
    this.status = input.status;
  }
}

export function toPortalApiError(error: unknown) {
  if (error instanceof PortalApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new PortalApiError({
      message: error.message
    });
  }

  return new PortalApiError({
    message: "Unexpected portal action failure"
  });
}

async function readPortalApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const fallbackRequestId = response.headers.get("x-request-id") ?? undefined;

  if (!response.ok) {
    if (text) {
      try {
        const parsed = JSON.parse(text) as {
          message?: string;
          requestId?: string;
        };

        if (parsed.message) {
          throw new PortalApiError({
            message: PUBLIC_PORTAL_API_MESSAGE,
            requestId: parsed.requestId ?? fallbackRequestId,
            status: response.status
          });
        }
      } catch (error) {
        if (error instanceof PortalApiError) {
          throw error;
        }

        if (error instanceof Error) {
          throw error;
        }
      }
    }

    throw new PortalApiError({
      message: PUBLIC_PORTAL_API_MESSAGE,
      requestId: fallbackRequestId,
      status: response.status
    });
  }

  if (!text) {
    throw new PortalApiError({
      message: PUBLIC_PORTAL_API_MESSAGE,
      requestId: fallbackRequestId,
      status: response.status
    });
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PortalApiError({
      message: PUBLIC_PORTAL_API_MESSAGE,
      requestId: fallbackRequestId,
      status: response.status
    });
  }
}

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

      return readPortalApiJson(response);
    },
    async listApps() {
      const response = await fetch("/api/canvas/auth/apps");
      const payload = await readPortalApiJson<{
        apps: Array<{ appName: string }>;
      }>(response);
      return payload.apps.map((app) => app.appName);
    },
    async selectApp(input) {
      const response = await fetch("/api/canvas/auth/select-app", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return readPortalApiJson(response);
    },
    async listDashboards() {
      const response = await fetch("/api/canvas/dashboards");
      return readPortalApiJson(response);
    },
    async createDashboard(input) {
      const response = await fetch("/api/canvas/dashboards", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return readPortalApiJson(response);
    },
    async listDashboardWidgets(dashboardId) {
      const response = await fetch(
        `/api/canvas/dashboards/${dashboardId}/widgets`
      );
      return readPortalApiJson(response);
    },
    async createDashboardWidget(input) {
      const response = await fetch(
        `/api/canvas/dashboards/${input.dashboardId}/widgets`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            type: input.type,
            datasetId: input.datasetId ?? null,
            config: input.config ?? null
          })
        }
      );

      return readPortalApiJson(response);
    },
    async updateDashboardWidget(input) {
      const response = await fetch(
        `/api/canvas/dashboards/${input.dashboardId}/widgets/${input.widgetId}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(input.config)
        }
      );

      return readPortalApiJson(response);
    },
    async updateDashboardWidgetLayout(input) {
      const response = await fetch(
        `/api/canvas/dashboards/${input.dashboardId}/widgets/${input.widgetId}/layout`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify(input.layout)
        }
      );

      return readPortalApiJson(response);
    },
    async deleteDashboardWidget(input) {
      const response = await fetch(
        `/api/canvas/dashboards/${input.dashboardId}/widgets/${input.widgetId}`,
        {
          method: "DELETE"
        }
      );

      return readPortalApiJson(response);
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

      return readPortalApiJson(response);
    },
    async getSelectedDashboard() {
      const response = await fetch("/api/canvas/dashboards/selected-dashboard");
      return readPortalApiJson(response);
    },
    async setSelectedDashboard(input) {
      const response = await fetch("/api/canvas/dashboards/selected-dashboard", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return readPortalApiJson(response);
    },
    async exportDashboard(input) {
      const response = await fetch(
        `/api/canvas/dashboards/${input.dashboardId}/export`
      );
      return readPortalApiJson(response);
    },
    async importDashboard(input) {
      const response = await fetch("/api/canvas/dashboards/import", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return readPortalApiJson(response);
    },
    async getDatasetPreview(datasetId) {
      const response = await fetch(`/api/canvas/datasets/${datasetId}/preview`);
      return readPortalApiJson(response);
    },
    async runDatasetChartQuery(input) {
      const response = await fetch(
        `/api/canvas/datasets/${input.datasetId}/chart-query`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            chartType: input.chartType,
            xField: input.xField,
            yField: input.yField
          })
        }
      );

      return readPortalApiJson(response);
    },
    async getDataset(datasetId) {
      const response = await fetch(`/api/canvas/datasets/${datasetId}`);
      return readPortalApiJson(response);
    },
    async createDatasetUpload(input) {
      const response = await fetch("/api/canvas/datasets", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return readPortalApiJson(response);
    },
    async uploadDatasetFile(input) {
      const response = await fetch(
        `/api/canvas/datasets/uploads/${input.uploadId}/file`,
        {
          method: "PUT",
          headers: {
            "content-type": input.file.type || "application/octet-stream"
          },
          body: input.file
        }
      );

      return readPortalApiJson(response);
    },
    async createWorkbook(input) {
      const response = await fetch("/api/canvas/workbooks", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(input)
      });

      return readPortalApiJson(response);
    }
  };
}
