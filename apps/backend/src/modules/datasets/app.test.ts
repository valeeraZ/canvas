import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

function readSessionCookie(value: string | string[] | undefined) {
  if (!value) {
    return "";
  }

  const cookie = Array.isArray(value) ? value[0] : value;
  return cookie.split(";")[0] ?? "";
}

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("dataset routes", () => {
  it("scopes dataset routes to the selected app context", async () => {
    let listRequest: unknown;
    let detailRequest: unknown;
    let createRequest: unknown;

    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      datasets: {
        listDatasets: async (tenantId?: string) => {
          listRequest = tenantId;
          return [
          {
            id: "ds_1",
            tenantId: tenantId ?? "tenant_demo",
            name: "Sales Upload",
            status: "ready",
            warnings: []
          }
        ];
        },
        getDataset: async (datasetId: string, tenantId?: string) => {
          detailRequest = {
            datasetId,
            tenantId
          };
          return {
          id: datasetId,
          tenantId: tenantId ?? "tenant_demo",
          name: "Sales Upload",
          status: "ready",
          warnings: []
          };
        },
        createUpload: async (input?: { filename: string; name: string; tenantId: string }) => {
          createRequest = input;
          return {
          upload: {
            bucket: "canvas-raw",
            objectKey: `${input?.tenantId ?? "tenant_demo"}/uploads/sales.csv`
          },
          dataset: {
            id: "ds_1",
            tenantId: input?.tenantId ?? "tenant_demo",
            name: "Sales Upload",
            status: "queued",
            warnings: []
          }
          };
        }
      }
    });

    apps.push(app);

    const unauthenticated = await app.inject({ method: "GET", url: "/datasets" });
    expect(unauthenticated.statusCode).toBe(401);

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: "canvas-data"
      }
    });

    const authHeaders = {
      authorization: "Bearer local-dev-token",
      cookie: readSessionCookie(session.headers["set-cookie"])
    };

    const listResponse = await app.inject({
      method: "GET",
      url: "/datasets",
      headers: authHeaders
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.id).toBe("ds_1");
    expect(listRequest).toBe("canvas-data");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/datasets/ds_1",
      headers: authHeaders
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().id).toBe("ds_1");
    expect((detailRequest as { tenantId?: string })?.tenantId).toBe("canvas-data");

    const createResponse = await app.inject({
      method: "POST",
      url: "/datasets/uploads",
      headers: authHeaders,
      payload: {
        filename: "sales.csv",
        name: "Sales Upload"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().upload.objectKey).toContain("uploads/sales.csv");
    expect((createRequest as { tenantId?: string })?.tenantId).toBe("canvas-data");
  });
});
