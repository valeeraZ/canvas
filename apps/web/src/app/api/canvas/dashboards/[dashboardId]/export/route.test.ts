import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../../lib/portal/session";
import { GET } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dashboard export route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies dashboard export from the backend", async () => {
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
            version: 1,
            dashboard: {
              name: "Executive Overview",
              workbookId: "wb_1"
            },
            shareSubjects: [{ type: "role", id: "ADMIN" }]
          }),
          { status: 200 }
        )
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/dash_1/export",
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
      params: Promise.resolve({
        dashboardId: "dash_1"
      })
    });
    const payload = (await response.json()) as {
      version: number;
      dashboard: { name: string };
    };

    expect(payload.version).toBe(1);
    expect(payload.dashboard.name).toBe("Executive Overview");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/dash_1/export"
    );
  });
});
