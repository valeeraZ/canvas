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

  it("returns backend requestId when selected dashboard update fails", async () => {
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
        new Response(
          JSON.stringify({
            message: "Selected dashboard write failed",
            requestId: "0df37bf3-ae96-41a0-949b-90ebf57de8b5"
          }),
          {
            status: 500,
            headers: {
              "content-type": "application/json",
              "x-request-id": "0df37bf3-ae96-41a0-949b-90ebf57de8b5"
            }
          }
        )
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

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBe(
      "0df37bf3-ae96-41a0-949b-90ebf57de8b5"
    );
    expect(await response.json()).toEqual({
      message: "Request failed",
      requestId: "0df37bf3-ae96-41a0-949b-90ebf57de8b5"
    });
  });
});
