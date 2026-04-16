import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../../lib/portal/session";
import { POST } from "./route";

const fetchMock = vi.fn<typeof fetch>();

describe("canvas dataset chart-query route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("forwards dataset chart-query requests to the backend", async () => {
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
            chartType: "bar",
            labels: ["Jan", "Feb"],
            series: [{ name: "revenue", data: [120, 150] }]
          }),
          { status: 200 }
        )
      );

    const request = new Request(
      "http://localhost:3000/api/canvas/datasets/ds_1/chart-query",
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
          chartType: "bar",
          xField: "month",
          yField: "revenue"
        })
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ datasetId: "ds_1" })
    });
    const payload = (await response.json()) as {
      labels: string[];
      series: Array<{ name: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.labels).toEqual(["Jan", "Feb"]);
    expect(payload.series[0]?.name).toBe("revenue");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/datasets/ds_1/chart-query"
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST"
    });
  });
});
