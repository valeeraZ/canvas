import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("dataset routes", () => {
  it("lists persisted datasets", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      datasets: {
        listDatasets: async () => [
          {
            id: "ds_1",
            tenantId: "tenant_demo",
            name: "Sales Upload",
            status: "ready",
            warnings: []
          }
        ],
        getDataset: async (datasetId: string) => ({
          id: datasetId,
          tenantId: "tenant_demo",
          name: "Sales Upload",
          status: "ready",
          warnings: []
        }),
        createUpload: async () => ({
          upload: {
            bucket: "canvas-raw",
            objectKey: "tenant_demo/uploads/sales.csv"
          },
          dataset: {
            id: "ds_1",
            tenantId: "tenant_demo",
            name: "Sales Upload",
            status: "queued",
            warnings: []
          }
        })
      }
    });

    apps.push(app);

    const listResponse = await app.inject({ method: "GET", url: "/datasets" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.id).toBe("ds_1");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/datasets/ds_1"
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().id).toBe("ds_1");

    const createResponse = await app.inject({
      method: "POST",
      url: "/datasets/uploads",
      payload: {
        filename: "sales.csv",
        name: "Sales Upload"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().upload.objectKey).toContain("uploads/sales.csv");
  });
});
