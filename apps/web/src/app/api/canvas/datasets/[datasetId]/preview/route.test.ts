import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../../lib/portal/session";
import { GET } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dataset preview route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("loads dataset preview data from the backend", async () => {
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
            datasetId: "ds_1",
            columns: [
              { name: "month", type: "string" },
              { name: "revenue", type: "number" }
            ],
            sampleRows: [{ month: "Jan", revenue: 120 }]
          }),
          { status: 200 }
        )
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/datasets/ds_1/preview",
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
      params: Promise.resolve({ datasetId: "ds_1" })
    });
    const payload = (await response.json()) as { columns: Array<{ type: string }> };

    expect(response.status).toBe(200);
    expect(payload.columns[1]?.type).toBe("number");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/datasets/ds_1/preview"
    );
  });
});
