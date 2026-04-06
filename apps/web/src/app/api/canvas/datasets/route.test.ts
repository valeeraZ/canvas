import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodePortalSession,
  PORTAL_SESSION_COOKIE
} from "../../../../lib/portal/session";
import { GET, POST } from "./route";

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

describe("canvas datasets route", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.CANVAS_BACKEND_BASE_URL;
  });

  it("creates an upload session and lists datasets through the backend", async () => {
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
            upload: {
              bucket: "canvas-raw",
              objectKey: "uploads/sales.csv",
              uploadUrl: "/datasets/uploads/upload_123/file"
            },
            dataset: {
              id: "ds_1",
              name: "Sales Upload",
              status: "ready",
              warningCount: 0
            }
          }),
          { status: 200 }
        )
      );

    const postRequest = new Request("http://localhost:3000/api/canvas/datasets", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: buildCookie()
      },
      body: JSON.stringify({
        filename: "sales.csv",
        name: "Sales Upload",
        content: "Month,Revenue\nJan,120"
      })
    });

    const postResponse = await POST(postRequest);
    const created = (await postResponse.json()) as {
      uploadId: string;
      upload: { bucket: string; objectKey: string; uploadUrl: string };
      dataset: { name: string; status: string };
    };

    expect(created.uploadId).toBe("upload_123");
    expect(created.upload.bucket).toBe("canvas-raw");
    expect(created.upload.objectKey).toContain("uploads/sales.csv");
    expect(created.upload.uploadUrl).toBe("/datasets/uploads/upload_123/file");
    expect(created.dataset.name).toBe("Sales Upload");
    expect(created.dataset.status).toBe("ready");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST"
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      filename: "sales.csv",
      name: "Sales Upload",
      content: "Month,Revenue\nJan,120"
    });

    fetchMock.mockReset();
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
              id: "ds_1",
              name: "Sales Upload",
              status: "ready",
              warningCount: 0
            }
          ]),
          { status: 200 }
        )
      );

    const listResponse = await GET(
      new Request("http://localhost:3000/api/canvas/datasets", {
        headers: {
          cookie: buildCookie()
        }
      })
    );
    const listed = (await listResponse.json()) as Array<{
      name: string;
      status: string;
      warningCount: number;
    }>;

    expect(listed.length).toBeGreaterThan(0);
    expect(listed[0]?.name).toBe("Sales Upload");
    expect(listed[0]?.warningCount).toBe(0);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://127.0.0.1:3001/datasets");
  });
});
