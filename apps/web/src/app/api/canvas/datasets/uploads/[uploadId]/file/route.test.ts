import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../../../../lib/portal/session";
import { PUT } from "./route";

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

describe("canvas dataset upload file route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("proxies the file upload stream to backend and preserves request id", async () => {
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
            uploadId: "upload_123",
            datasetId: "ds_1",
            bucket: "canvas-raw",
            objectKey: "canvas/uploads/sales.csv",
            sizeBytes: 21,
            importStatus: "profiling"
          }),
          {
            status: 200,
            headers: {
              "x-request-id": "backend-upload-req"
            }
          }
        )
      );

    const response = await PUT(
      new Request("http://localhost:3000/api/canvas/datasets/uploads/upload_123/file", {
        method: "PUT",
        headers: {
          cookie: buildCookie(),
          "content-type": "text/csv"
        },
        body: "Month,Revenue\nJan,120"
      }),
      {
        params: Promise.resolve({
          uploadId: "upload_123"
        })
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://127.0.0.1:3001/datasets/uploads/upload_123/file"
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "PUT",
      headers: expect.any(Headers)
    });
  });
});
