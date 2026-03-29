import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../lib/portal/session";
import { POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dashboard import route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies dashboard import to the backend", async () => {
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
            id: "dash_imported",
            tenantId: "canvas",
            name: "Imported Overview",
            workbookId: "wb_1"
          }),
          { status: 200 }
        )
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/dashboards/import",
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
          version: 1,
          dashboard: {
            name: "Imported Overview",
            workbookId: "wb_1"
          },
          shareSubjects: [{ type: "role", id: "ADMIN" }]
        })
      }
    );

    const response = await POST(request);
    const payload = (await response.json()) as {
      id: string;
      name: string;
    };

    expect(payload.id).toBe("dash_imported");
    expect(payload.name).toBe("Imported Overview");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/dashboards/import"
    );
  });
});
