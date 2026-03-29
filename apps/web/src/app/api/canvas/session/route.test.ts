import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("canvas session route", () => {
  const fetchMock = vi.fn<typeof fetch>();

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies session exchange to the backend and stores a portal session cookie", async () => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.CANVAS_BACKEND_BASE_URL = "http://127.0.0.1:3001";

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          selectedApp: "canvas",
          expiresIn: 1800,
          principal: {
            displayName: "Local Dev",
            employeeId: "dev-1",
            roles: ["ADMIN"]
          }
        }),
        { status: 200 }
      )
    );

    const request = new Request("http://localhost:3000/api/canvas/session", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        token: "amtoken-1",
        appName: "canvas"
      })
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      selectedApp: string;
      principal: {
        displayName: string;
        employeeId: string;
      };
    };

    expect(payload.selectedApp).toBe("canvas");
    expect(payload.principal.displayName).toBe("Local Dev");
    expect(payload.principal.employeeId).toBe("dev-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:3001/session/exchange");
    expect(response.headers.get("set-cookie")).toContain("canvas_portal_session=");
  });
});
