import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../../api/app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("dashboard routes", () => {
  it("creates, lists, and fetches dashboards", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      dashboards: {
        listDashboards: async () => [
          {
            id: "dash_1",
            tenantId: "tenant_demo",
            name: "Overview",
            workbookId: "wb_1"
          }
        ],
        getDashboard: async (dashboardId: string) => ({
          id: dashboardId,
          tenantId: "tenant_demo",
          name: "Overview",
          workbookId: "wb_1"
        }),
        createDashboard: async (input: {
          name: string;
          workbookId?: string;
        }) => ({
          id: "dash_1",
          tenantId: "tenant_demo",
          name: input.name,
          workbookId: input.workbookId ?? null
        })
      }
    });

    apps.push(app);

    const listResponse = await app.inject({
      method: "GET",
      url: "/dashboards"
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.id).toBe("dash_1");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/dashboards/dash_1"
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().id).toBe("dash_1");

    const createResponse = await app.inject({
      method: "POST",
      url: "/dashboards",
      payload: {
        name: "Overview",
        workbookId: "wb_1"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().workbookId).toBe("wb_1");
  });
});
