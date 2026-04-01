import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../lib/portal/session";
import { GET, POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dashboards route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies dashboard data from the backend using the portal session", async () => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.CANVAS_BACKEND_BASE_URL = "http://127.0.0.1:3001";

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            selectedApp: "canvas"
          }),
          {
            status: 200,
            headers: {
              "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "dash_live",
              tenantId: "canvas",
              name: "Executive Overview",
              workbookId: "wb_1"
            }
          ]),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            dashboardId: "dash_live"
          }),
          { status: 200 }
        )
      );

    const request = new Request("http://localhost:3000/api/canvas/dashboards", {
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
    });

    const response = await GET(request);
    const payload = (await response.json()) as {
      dashboards: Array<{ id: string; name: string }>;
      selectedDashboardId: string | null;
    };

    expect(response.status).toBe(200);
    expect(payload.dashboards[0]?.id).toBe("dash_live");
    expect(payload.selectedDashboardId).toBe("dash_live");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:3001/session/exchange");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://127.0.0.1:3001/dashboards");
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/selected-dashboard"
    );
  });

  it("creates a dashboard through the backend using the portal session", async () => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.CANVAS_BACKEND_BASE_URL = "http://127.0.0.1:3001";

    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            selectedApp: "canvas"
          }),
          {
            status: 200,
            headers: {
              "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "dash_new",
            tenantId: "canvas",
            name: "New KPI Board",
            workbookId: "wb_1"
          }),
          { status: 200 }
        )
      );

    const request = new Request("http://localhost:3000/api/canvas/dashboards", {
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
        name: "New KPI Board",
        workbookId: "wb_1"
      })
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      id: string;
      name: string;
      workbookId: string | null;
    };

    expect(response.status).toBe(200);
    expect(payload.id).toBe("dash_new");
    expect(payload.name).toBe("New KPI Board");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://127.0.0.1:3001/dashboards");
  });
});
