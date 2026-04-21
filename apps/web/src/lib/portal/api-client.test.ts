import { afterEach, describe, expect, it, vi } from "vitest";
import { createPortalApiClient, PortalApiError } from "./api-client";

const fetchMock = vi.fn<typeof fetch>();

describe("createPortalApiClient", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("throws a readable error when a create call returns an empty body", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 500
      })
    );

    const client = createPortalApiClient();

    await expect(
      client.createWorkbook({
        name: "Executive Workbook"
      })
    ).rejects.toMatchObject<PortalApiError>({
      message: "Request failed"
    });
  });

  it("preserves request id on structured portal api errors", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Database write failed",
          requestId: "req-workbook-42"
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json"
          }
        }
      )
    );

    const client = createPortalApiClient();

    await expect(
      client.createWorkbook({
        name: "Executive Workbook"
      })
    ).rejects.toMatchObject<PortalApiError>({
      message: "Request failed",
      requestId: "req-workbook-42"
    });
  });

  it("loads dashboard widgets through the portal api", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "widget_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            layout: {
              x: 0,
              y: 0,
              w: 1,
              h: 1
            },
            config: {
              datasetId: "ds_1",
              chartType: "bar",
              xField: "month",
              yField: "revenue"
            }
          }
        ]),
        { status: 200 }
      )
    );

    const widgets = await createPortalApiClient().listDashboardWidgets("dash_1");

    expect(widgets[0]?.id).toBe("widget_1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/canvas/dashboards/dash_1/widgets",
      expect.objectContaining({
        headers: expect.any(Headers)
      })
    );
  });

  it("sends a dashboard widget layout patch through the portal api", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "widget_1",
          tenantId: "canvas",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          layout: {
            x: 1,
            y: 0,
            w: 1,
            h: 1
          },
          config: null
        }),
        { status: 200 }
      )
    );

    const widget = await createPortalApiClient().updateDashboardWidgetLayout({
      dashboardId: "dash_1",
      widgetId: "widget_1",
      layout: {
        x: 1,
        y: 0,
        w: 1,
        h: 1
      }
    });

    expect(widget.layout.x).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/canvas/dashboards/dash_1/widgets/widget_1/layout",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          x: 1,
          y: 0,
          w: 1,
          h: 1
        })
      })
    );
  });

  it("sends a dashboard widget delete through the portal api", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          deletedWidgetId: "widget_1",
          widgets: []
        }),
        { status: 200 }
      )
    );

    const payload = await createPortalApiClient().deleteDashboardWidget({
      dashboardId: "dash_1",
      widgetId: "widget_1"
    });

    expect(payload.deletedWidgetId).toBe("widget_1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/canvas/dashboards/dash_1/widgets/widget_1",
      expect.objectContaining({
        method: "DELETE"
      })
    );
  });

  it("loads dataset preview data through the portal api", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          datasetId: "ds_1",
          columns: [
            { name: "month", type: "string" },
            { name: "revenue", type: "number" }
          ],
          sampleRows: [{ month: "Jan", revenue: 120 }]
        }),
        { status: 200 }
      )
    );

    const preview = await createPortalApiClient().getDatasetPreview("ds_1");

    expect(preview.columns[1]?.type).toBe("number");
    expect("records" in preview).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/canvas/datasets/ds_1/preview",
      expect.objectContaining({
        headers: expect.any(Headers)
      })
    );
  });

  it("runs dataset chart queries through the portal api", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          chartType: "bar",
          labels: ["Jan", "Feb"],
          series: [
            {
              name: "revenue",
              data: [120, 150]
            }
          ]
        }),
        { status: 200 }
      )
    );

    const payload = await createPortalApiClient().runDatasetChartQuery({
      datasetId: "ds_1",
      chartType: "bar",
      xField: "month",
      yField: "revenue"
    });

    expect(payload.labels).toEqual(["Jan", "Feb"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/canvas/datasets/ds_1/chart-query",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chartType: "bar",
          xField: "month",
          yField: "revenue"
        })
      })
    );
  });

  it("creates dataset uploads and uploads a file through the portal api", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          uploadId: "upload_123",
          upload: {
            bucket: "canvas-raw",
            objectKey: "canvas/uploads/sales.csv",
            uploadUrl: "/datasets/uploads/upload_123/file"
          },
          dataset: {
            id: "ds_1",
            name: "Sales Upload",
            status: "queued",
            warningCount: 0
          }
        }),
        { status: 200 }
      )
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          uploadId: "upload_123",
          datasetId: "ds_1",
          bucket: "canvas-raw",
          objectKey: "canvas/uploads/sales.csv",
          sizeBytes: 21,
          importStatus: "profiling"
        }),
        { status: 200 }
      )
    );

    const created = await createPortalApiClient().createDatasetUpload({
      appName: "frame_app",
      filename: "sales.csv",
      name: "Sales Upload",
      content: "Month,Revenue\nJan,120"
    });
    const uploaded = await createPortalApiClient().uploadDatasetFile({
      uploadId: "upload_123",
      file: new File(["Month,Revenue\nJan,120"], "sales.csv", {
        type: "text/csv"
      })
    });

    expect(created.dataset.id).toBe("ds_1");
    expect(created.uploadId).toBe("upload_123");
    expect(uploaded.datasetId).toBe("ds_1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/canvas/datasets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          appName: "frame_app",
          filename: "sales.csv",
          name: "Sales Upload",
          content: "Month,Revenue\nJan,120"
        })
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/canvas/datasets/uploads/upload_123/file",
      expect.objectContaining({
        method: "PUT"
      })
    );
  });

  it("reports browser upload progress when uploading a dataset file", async () => {
    const progressEvents: number[] = [];
    const requests: Array<{
      method?: string;
      url?: string;
      headers: Record<string, string>;
      body?: unknown;
    }> = [];

    class FakeXMLHttpRequest {
      status = 200;
      responseText = JSON.stringify({
        uploadId: "upload_123",
        datasetId: "ds_1",
        bucket: "canvas-raw",
        objectKey: "canvas/uploads/sales.csv",
        sizeBytes: 21,
        importStatus: "profiling"
      });
      upload: {
        onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void;
      } = {};
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private request = {
        headers: {} as Record<string, string>
      };

      open(method: string, url: string) {
        this.request.method = method;
        this.request.url = url;
      }

      setRequestHeader(name: string, value: string) {
        this.request.headers[name] = value;
      }

      send(body: unknown) {
        this.request.body = body;
        requests.push(this.request);
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: 10,
          total: 20
        });
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: 20,
          total: 20
        });
        this.onload?.();
      }
    }

    vi.stubGlobal("XMLHttpRequest", FakeXMLHttpRequest);

    const uploaded = await createPortalApiClient().uploadDatasetFile({
      uploadId: "upload_123",
      file: new File(["Month,Revenue\nJan,120"], "sales.csv", {
        type: "text/csv"
      }),
      onProgress: (percent) => progressEvents.push(percent)
    });

    expect(uploaded.importStatus).toBe("profiling");
    expect(progressEvents).toEqual([50, 100]);
    expect(requests[0]).toMatchObject({
      method: "PUT",
      url: "/api/canvas/datasets/uploads/upload_123/file",
      headers: {
        "content-type": "text/csv"
      }
    });
  });
});
