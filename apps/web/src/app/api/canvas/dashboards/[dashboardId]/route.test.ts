import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../lib/portal/session";
import { DELETE, PATCH } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dashboard detail route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies dashboard rename and remove through the backend", async () => {
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
            id: "dash_1",
            tenantId: "canvas",
            name: "Renamed Overview",
            workbookId: null,
            status: "active",
            author: {
              externalUserId: "dev-1",
              displayName: "Local Dev"
            },
            createdAt: "2026-04-21T09:00:00.000Z",
            updatedAt: "2026-04-21T10:00:00.000Z"
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 200,
          headers: {
            "set-cookie": "canvas_session=backend-session; Path=/; HttpOnly"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ deletedDashboardId: "dash_1" }), {
          status: 200
        })
      );

    const cookie = `${PORTAL_SESSION_COOKIE}=${encodePortalSession({
      token: "amtoken-1",
      selectedApp: "canvas",
      principal: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    })}`;

    const renameResponse = await PATCH(
      new Request("http://localhost:3000/api/canvas/dashboards/dash_1", {
        method: "PATCH",
        headers: {
          cookie,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: "Renamed Overview"
        })
      }),
      {
        params: Promise.resolve({
          dashboardId: "dash_1"
        })
      }
    );
    const renamed = await renameResponse.json();

    const removeResponse = await DELETE(
      new Request("http://localhost:3000/api/canvas/dashboards/dash_1", {
        method: "DELETE",
        headers: {
          cookie
        }
      }),
      {
        params: Promise.resolve({
          dashboardId: "dash_1"
        })
      }
    );
    const removed = await removeResponse.json();

    expect(renamed.name).toBe("Renamed Overview");
    expect(removed.deletedDashboardId).toBe("dash_1");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/dash_1"
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "PATCH"
    });
    expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
      method: "DELETE"
    });
  });
});
