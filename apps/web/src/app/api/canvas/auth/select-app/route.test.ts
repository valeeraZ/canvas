import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../lib/portal/session";
import { POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas auth select-app route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("switches the app through the backend and refreshes the portal session cookie", async () => {
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
            tenantId: "canvas-ops",
            roles: ["ADMIN", "USER"]
          }),
          { status: 200 }
        )
      );

    const request = new Request("http://localhost:3000/api/canvas/auth/select-app", {
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
        appName: "canvas-ops"
      })
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      selectedApp: string;
      principal: {
        displayName: string;
        employeeId: string;
        roles: string[];
      };
    };

    expect(payload.selectedApp).toBe("canvas-ops");
    expect(payload.principal.roles).toEqual(["ADMIN", "USER"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://127.0.0.1:3001/auth/select-app");
    expect(response.headers.get("set-cookie")).toContain("canvas_portal_session=");
  });
});
