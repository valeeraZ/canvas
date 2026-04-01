import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../lib/portal/session";
import { GET, POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas workbooks route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies workbook data from the backend using the portal session", async () => {
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
          JSON.stringify([
            {
              id: "wb_live",
              tenantId: "canvas",
              name: "Executive Workbook"
            }
          ]),
          { status: 200 }
        )
      );

    const request = new Request("http://localhost:3000/api/canvas/workbooks", {
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
    const payload = (await response.json()) as Array<{
      id: string;
      name: string;
    }>;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toMatch(/.+/);
    expect(payload[0]?.id).toBe("wb_live");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://127.0.0.1:3001/workbooks");
  });

  it("creates a workbook through the backend using the portal session", async () => {
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
            id: "wb_new",
            tenantId: "canvas",
            name: "Executive Workbook"
          }),
          { status: 200 }
        )
      );

    const request = new Request("http://localhost:3000/api/canvas/workbooks", {
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
        name: "Executive Workbook"
      })
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      id: string;
      name: string;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toMatch(/.+/);
    expect(payload.id).toBe("wb_new");
    expect(payload.name).toBe("Executive Workbook");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://127.0.0.1:3001/workbooks");
  });

  it("returns backend requestId when workbook creation fails", async () => {
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
            message: "Database write failed",
            requestId: "req-workbook-42"
          }),
          {
            status: 500,
            headers: {
              "content-type": "application/json",
              "x-request-id": "req-workbook-42"
            }
          }
        )
      );

    const request = new Request("http://localhost:3000/api/canvas/workbooks", {
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
        name: "Executive Workbook"
      })
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(response.headers.get("x-request-id")).toBe("req-workbook-42");
    expect(await response.json()).toEqual({
      message: "Request failed",
      requestId: "req-workbook-42"
    });
  });
});
