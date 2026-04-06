import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../lib/portal/session";
import { GET } from "./route";

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

describe("canvas dataset detail route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies dataset detail through the backend", async () => {
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
            id: "ds_1",
            name: "Sales Upload",
            status: "queued",
            warnings: [],
            uploadedByDisplayName: "Local Dev",
            sourceFilename: "sales.csv",
            usageSummary: {
              dashboards: [{ id: "dash_1", name: "Executive Overview" }],
              widgets: [],
              workbooks: []
            }
          }),
          {
            status: 200,
            headers: {
              "x-request-id": "backend-dataset-detail"
            }
          }
        )
      );

    const response = await GET(
      new Request("http://localhost:3000/api/canvas/datasets/ds_1", {
        headers: {
          cookie: buildCookie()
        }
      }),
      {
        params: Promise.resolve({
          datasetId: "ds_1"
        })
      }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.name).toBe("Sales Upload");
    expect(payload.usageSummary.dashboards[0]?.id).toBe("dash_1");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://127.0.0.1:3001/datasets/ds_1");
  });
});
