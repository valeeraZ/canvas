import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../lib/portal/session";
import { GET, POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

function buildCookie() {
  return `${PORTAL_SESSION_COOKIE}=${encodePortalSession({
    token: "amtoken-1",
    selectedApp: "canvas",
    principal: {
      displayName: "Local Dev",
      employeeId: "dev-1",
      roles: ["ADMIN"]
    }
  })}`;
}

describe("canvas selected dashboard route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("reads and updates the selected dashboard through the backend", async () => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.CANVAS_BACKEND_BASE_URL = "http://127.0.0.1:3001";

    fetchMock
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 200,
          headers: {
            "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ dashboardId: "dash_1" }), { status: 200 })
      );

    const initial = await GET(
      new Request(
        "http://localhost:3000/api/canvas/dashboards/selected-dashboard",
        {
          headers: {
            cookie: buildCookie()
          }
        }
      )
    );
    const initialPayload = (await initial.json()) as {
      dashboardId: string | null;
    };

    expect(initialPayload.dashboardId).toBe("dash_1");

    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 200,
          headers: {
            "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ dashboardId: "dash_2" }), { status: 200 })
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/selected-dashboard",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: buildCookie()
        },
        body: JSON.stringify({
          dashboardId: "dash_2"
        })
      }
    );

    const updated = await POST(request);
    const updatedPayload = (await updated.json()) as {
      dashboardId: string | null;
    };

    expect(updatedPayload.dashboardId).toBe("dash_2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/selected-dashboard"
    );
  });
});
