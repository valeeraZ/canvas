import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("workbook routes", () => {
  it("creates, lists, and fetches workbooks", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      workbooks: {
        listWorkbooks: async () => [
          {
            id: "wb_1",
            tenantId: "tenant_demo",
            name: "Sales Workbook"
          }
        ],
        getWorkbook: async (workbookId: string) => ({
          id: workbookId,
          tenantId: "tenant_demo",
          name: "Sales Workbook"
        }),
        createWorkbook: async (input: { name: string }) => ({
          id: "wb_1",
          tenantId: "tenant_demo",
          name: input.name
        })
      }
    });

    apps.push(app);

    const listResponse = await app.inject({ method: "GET", url: "/workbooks" });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.id).toBe("wb_1");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/workbooks/wb_1"
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().id).toBe("wb_1");

    const createResponse = await app.inject({
      method: "POST",
      url: "/workbooks",
      payload: {
        name: "Sales Workbook"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().name).toBe("Sales Workbook");
  });
});
