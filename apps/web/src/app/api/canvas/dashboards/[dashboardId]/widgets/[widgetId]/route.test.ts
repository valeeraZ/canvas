import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../../../lib/portal/session";
import { PATCH } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dashboard widget detail route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("updates a widget config through the backend", async () => {
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
            id: "widget_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            config: {
              datasetId: "ds_1",
              chartType: "area",
              xField: "month",
              yField: "revenue",
              seriesField: "region"
            }
          }),
          { status: 200 }
        )
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/dash_1/widgets/widget_1",
      {
        method: "PATCH",
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
          datasetId: "ds_1",
          chartType: "area",
          xField: "month",
          yField: "revenue",
          seriesField: "region"
        })
      }
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        dashboardId: "dash_1",
        widgetId: "widget_1"
      })
    });
    const payload = (await response.json()) as { config: { chartType: string } };

    expect(response.status).toBe(200);
    expect(payload.config.chartType).toBe("area");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/dash_1/widgets/widget_1"
    );
  });
});
