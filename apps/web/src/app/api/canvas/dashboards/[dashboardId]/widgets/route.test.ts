import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../../lib/portal/session";
import { GET, POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dashboard widgets route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("lists dashboard widgets through the backend", async () => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.CANVAS_BACKEND_BASE_URL = "http://127.0.0.1:3001";

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ selectedApp: "canvas" }), {
          status: 200,
          headers: {
            "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "widget_1",
              tenantId: "canvas",
              dashboardId: "dash_1",
              type: "chart",
              datasetId: "ds_1",
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

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/dash_1/widgets",
      {
        headers: {
          cookie: `${PORTAL_SESSION_COOKIE}=${encodePortalSession({
            token: "amtoken-1",
            selectedApp: "canvas",
            principal: {
              displayName: "Local Dev",
              employeeId: "dev-1",
              roles: ["ADMIN"]
            }
          })}`
        }
      }
    );

    const response = await GET(request, {
      params: Promise.resolve({ dashboardId: "dash_1" })
    });
    const payload = (await response.json()) as Array<{ id: string }>;

    expect(response.status).toBe(200);
    expect(payload[0]?.id).toBe("widget_1");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/dash_1/widgets"
    );
  });

  it("creates a chart widget through the backend", async () => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.CANVAS_BACKEND_BASE_URL = "http://127.0.0.1:3001";

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ selectedApp: "canvas" }), {
          status: 200,
          headers: {
            "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "widget_2",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            config: {
              datasetId: "ds_1",
              chartType: "line",
              xField: "month",
              yField: "revenue"
            }
          }),
          { status: 200 }
        )
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/dash_1/widgets",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${PORTAL_SESSION_COOKIE}=${encodePortalSession({
            token: "amtoken-1",
            selectedApp: "canvas",
            principal: {
              displayName: "Local Dev",
              employeeId: "dev-1",
              roles: ["ADMIN"]
            }
          })}`
        },
        body: JSON.stringify({
          type: "chart",
          datasetId: "ds_1",
          config: {
            datasetId: "ds_1",
            chartType: "line",
            xField: "month",
            yField: "revenue"
          }
        })
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ dashboardId: "dash_1" })
    });
    const payload = (await response.json()) as { id: string };

    expect(response.status).toBe(200);
    expect(payload.id).toBe("widget_2");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/dash_1/widgets"
    );
  });

  it("creates a table chart widget through the backend", async () => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.CANVAS_BACKEND_BASE_URL = "http://127.0.0.1:3001";

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ selectedApp: "canvas" }), {
          status: 200,
          headers: {
            "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "widget_3",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            config: {
              datasetId: "ds_1",
              chartType: "table",
              columns: ["month", "revenue"],
              pageSize: 10
            }
          }),
          { status: 200 }
        )
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/dash_1/widgets",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${PORTAL_SESSION_COOKIE}=${encodePortalSession({
            token: "amtoken-1",
            selectedApp: "canvas",
            principal: {
              displayName: "Local Dev",
              employeeId: "dev-1",
              roles: ["ADMIN"]
            }
          })}`
        },
        body: JSON.stringify({
          type: "chart",
          datasetId: "ds_1",
          config: {
            datasetId: "ds_1",
            chartType: "table",
            columns: ["month", "revenue"],
            pageSize: 10
          }
        })
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ dashboardId: "dash_1" })
    });
    const forwarded = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body ?? "{}")
    ) as { type: string; config: { chartType: string } };

    expect(response.status).toBe(200);
    expect(forwarded.type).toBe("chart");
    expect(forwarded.config.chartType).toBe("table");
  });
});
