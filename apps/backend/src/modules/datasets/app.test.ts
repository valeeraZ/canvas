import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

function readSessionCookie(value: string | string[] | undefined) {
  if (!value) {
    return "";
  }

  const cookie = Array.isArray(value) ? value[0] : value;
  return cookie.split(";")[0] ?? "";
}

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("dataset routes", () => {
  it("scopes dataset routes to the selected app context", async () => {
    let listRequest: unknown;
    let detailRequest: unknown;
    let createRequest: unknown;
    let previewRequest: unknown;
    let chartQueryRequest: unknown;
    let uploadFileRequest: unknown;

    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      datasets: {
        listDatasets: async (tenantId?: string) => {
          listRequest = tenantId;
          return [
          {
            id: "ds_1",
            tenantId: tenantId ?? "tenant_demo",
            name: "Sales Upload",
            status: "ready",
            warnings: []
          }
        ];
        },
        getDataset: async (datasetId: string, tenantId?: string) => {
          detailRequest = {
            datasetId,
            tenantId
          };
          return {
          id: datasetId,
          tenantId: tenantId ?? "tenant_demo",
          name: "Sales Upload",
          status: "ready",
          warnings: [],
          uploadedByExternalUserId: "dev-1",
          uploadedByDisplayName: "Local Dev",
          uploadedAt: "2026-04-02T10:00:00.000Z",
          sourceFilename: "sales.csv",
          contentType: "text/csv",
          sizeBytes: 256,
          storageBucket: "canvas-raw",
          storageObjectKey: "canvas/uploads/sales.csv",
          storageUploadId: "s3-upload-1",
          importStatus: "queued",
          usageSummary: {
            dashboards: [
              {
                id: "dash_1",
                name: "Executive Overview"
              }
            ],
            widgets: [
              {
                id: "widget_1",
                dashboardId: "dash_1",
                dashboardName: "Executive Overview",
                type: "chart"
              }
            ],
            workbooks: [
              {
                id: "wb_1",
                name: "Revenue Planning"
              }
            ]
          }
          };
        },
        createUpload: async (input?: {
          filename: string;
          name: string;
          tenantId: string;
          contentType?: string;
          sizeBytes?: number;
          uploadedByExternalUserId?: string;
          uploadedByDisplayName?: string;
        }) => {
          createRequest = input;
          return {
          uploadId: "upload_123",
          upload: {
            bucket: "canvas-raw",
            objectKey: `${input?.tenantId ?? "tenant_demo"}/uploads/sales.csv`,
            uploadUrl: `/datasets/uploads/upload_123/file`
          },
          dataset: {
            id: "ds_1",
            tenantId: input?.tenantId ?? "tenant_demo",
            name: "Sales Upload",
            status: "queued",
            warnings: []
          }
          };
        },
        getDatasetPreview: async (input?: { datasetId: string; tenantId: string }) => {
          previewRequest = input;
          return {
            datasetId: input?.datasetId ?? "ds_1",
            columns: [
              { name: "month", type: "string" },
              { name: "revenue", type: "number" }
            ],
            sampleRows: [{ month: "Jan", revenue: 120 }]
          };
        },
        runChartQuery: async (input?: {
          datasetId: string;
          tenantId: string;
          chartType: "bar" | "line" | "area";
          xField: string;
          yField: string;
        }) => {
          chartQueryRequest = input;
          return {
            chartType: input?.chartType ?? "bar",
            labels: ["Jan", "Feb"],
            series: [
              {
                name: input?.yField ?? "revenue",
                data: [120, 150]
              }
            ]
          };
        },
        uploadFile: async (input?: {
          uploadId: string;
          tenantId: string;
          contentType?: string;
          body: AsyncIterable<Buffer | string>;
        }) => {
          uploadFileRequest = input;
          return {
            uploadId: input?.uploadId ?? "upload_123",
            datasetId: "ds_1",
            bucket: "canvas-raw",
            objectKey: "canvas-data/uploads/sales.csv",
            sizeBytes: 11,
            importStatus: "profiling"
          };
        }
      }
    });

    apps.push(app);

    const unauthenticated = await app.inject({ method: "GET", url: "/datasets" });
    expect(unauthenticated.statusCode).toBe(401);

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: "canvas-data"
      }
    });

    const authHeaders = {
      authorization: "Bearer local-dev-token",
      cookie: readSessionCookie(session.headers["set-cookie"])
    };

    const listResponse = await app.inject({
      method: "GET",
      url: "/datasets",
      headers: authHeaders
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.id).toBe("ds_1");
    expect(listRequest).toBe("canvas-data");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/datasets/ds_1",
      headers: authHeaders
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().id).toBe("ds_1");
    expect(detailResponse.json().uploadedByDisplayName).toBe("Local Dev");
    expect(detailResponse.json().usageSummary.dashboards[0]?.id).toBe("dash_1");
    expect((detailRequest as { tenantId?: string })?.tenantId).toBe("canvas-data");

    const previewResponse = await app.inject({
      method: "GET",
      url: "/datasets/ds_1/preview",
      headers: authHeaders
    });
    expect(previewResponse.statusCode).toBe(200);
    expect(previewResponse.json().columns[1]?.type).toBe("number");
    expect((previewRequest as { tenantId?: string })?.tenantId).toBe("canvas-data");

    const chartResponse = await app.inject({
      method: "POST",
      url: "/datasets/ds_1/chart-query",
      headers: authHeaders,
      payload: {
        chartType: "bar",
        xField: "month",
        yField: "revenue"
      }
    });
    expect(chartResponse.statusCode).toBe(200);
    expect(chartResponse.json().labels).toEqual(["Jan", "Feb"]);
    expect((chartQueryRequest as { tenantId?: string })?.tenantId).toBe(
      "canvas-data"
    );

    const createResponse = await app.inject({
      method: "POST",
      url: "/datasets/uploads",
      headers: authHeaders,
      payload: {
        filename: "sales.csv",
        name: "Sales Upload",
        contentType: "text/csv",
        sizeBytes: 256
      }
    });
    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().uploadId).toBe("upload_123");
    expect(createResponse.json().upload.objectKey).toContain("uploads/sales.csv");
    expect(createResponse.json().upload.uploadUrl).toBe("/datasets/uploads/upload_123/file");
    expect((createRequest as { tenantId?: string })?.tenantId).toBe("canvas-data");
    expect((createRequest as { contentType?: string })?.contentType).toBe("text/csv");
    expect((createRequest as { sizeBytes?: number })?.sizeBytes).toBe(256);
    expect((createRequest as { uploadedByExternalUserId?: string })?.uploadedByExternalUserId).toBe(
      "dev-1"
    );
    expect((createRequest as { uploadedByDisplayName?: string })?.uploadedByDisplayName).toBe(
      "Local Dev"
    );

    const uploadResponse = await app.inject({
      method: "PUT",
      url: "/datasets/uploads/upload_123/file",
      headers: {
        ...authHeaders,
        "content-type": "text/csv"
      },
      payload: "Month,Revenue"
    });
    expect(uploadResponse.statusCode).toBe(200);
    expect(uploadResponse.json().uploadId).toBe("upload_123");
    expect(uploadResponse.json().importStatus).toBe("profiling");
    expect((uploadFileRequest as { tenantId?: string })?.tenantId).toBe(
      "canvas-data"
    );
    expect((uploadFileRequest as { contentType?: string })?.contentType).toBe(
      "text/csv"
    );
  });
});
