import { afterEach, describe, expect, it, vi } from "vitest";
import { createPortalApiClient, PortalApiError } from "./api-client";

const fetchMock = vi.fn<typeof fetch>();

describe("createPortalApiClient", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("throws a readable error when a create call returns an empty body", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 500
      })
    );

    const client = createPortalApiClient();

    await expect(
      client.createWorkbook({
        name: "Executive Workbook"
      })
    ).rejects.toMatchObject<PortalApiError>({
      message: "Request failed"
    });
  });

  it("preserves request id on structured portal api errors", async () => {
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Database write failed",
          requestId: "req-workbook-42"
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json"
          }
        }
      )
    );

    const client = createPortalApiClient();

    await expect(
      client.createWorkbook({
        name: "Executive Workbook"
      })
    ).rejects.toMatchObject<PortalApiError>({
      message: "Request failed",
      requestId: "req-workbook-42"
    });
  });
});
