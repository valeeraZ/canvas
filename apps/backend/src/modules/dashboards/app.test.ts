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

describe("dashboard routes", () => {
  it("creates, lists, and fetches dashboards", async () => {
    let visibleRequest: unknown;
    let shareRequest: unknown;
    let selectedReadRequest: unknown;
    let selectedWriteRequest: unknown;

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
        listVisibleDashboards: async (input: unknown) => {
          visibleRequest = input;
          return [
            {
              id: "dash_1",
              tenantId: "tenant_demo",
              name: "Overview",
              workbookId: "wb_1"
            }
          ];
        },
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
        }),
        shareDashboard: async (input: unknown) => {
          shareRequest = input;
          return {
            dashboardId: "dash_1",
            subjects: [{ type: "role", id: "ADMIN" }],
            rules: [
              {
                id: "rule_1",
                dashboardId: "dash_1",
                appId: "canvas",
                subjectType: "role",
                subjectId: "ADMIN"
              }
            ]
          };
        },
        getSelectedDashboard: async (input: unknown) => {
          selectedReadRequest = input;
          return {
            dashboardId: "dash_1"
          };
        },
        setSelectedDashboard: async (input: unknown) => {
          selectedWriteRequest = input;
          return {
            dashboardId: "dash_2"
          };
        }
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

    const visibleResponse = await app.inject({
      method: "GET",
      url: "/dashboards/visible"
    });
    expect(visibleResponse.statusCode).toBe(401);

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: "canvas"
      }
    });

    const authorizedVisible = await app.inject({
      method: "GET",
      url: "/dashboards/visible",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });
    expect(authorizedVisible.statusCode).toBe(200);
    expect((visibleRequest as { externalUserId?: string })?.externalUserId).toBe(
      "dev-1"
    );
    expect((visibleRequest as { roles?: string[] })?.roles).toContain("ADMIN");
    expect((visibleRequest as { tenantId?: string })?.tenantId).toBe("canvas");
    expect(authorizedVisible.json()[0]?.id).toBe("dash_1");

    const shareResponse = await app.inject({
      method: "POST",
      url: "/dashboards/dash_1/share",
      payload: {
        subjects: [{ type: "role", id: "ADMIN" }]
      }
    });
    expect(shareResponse.statusCode).toBe(200);
    expect((shareRequest as { dashboardId?: string })?.dashboardId).toBe("dash_1");
    expect(shareResponse.json().rules[0]?.subjectId).toBe("ADMIN");

    const selectedResponse = await app.inject({
      method: "GET",
      url: "/dashboards/selected-dashboard",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });
    expect(selectedResponse.statusCode).toBe(200);
    expect(
      (selectedReadRequest as { externalUserId?: string })?.externalUserId
    ).toBe("dev-1");
    expect(selectedResponse.json().dashboardId).toBe("dash_1");

    const selectedWriteResponse = await app.inject({
      method: "POST",
      url: "/dashboards/selected-dashboard",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      },
      payload: {
        dashboardId: "dash_2"
      }
    });
    expect(selectedWriteResponse.statusCode).toBe(200);
    expect(
      (selectedWriteRequest as { dashboardId?: string })?.dashboardId
    ).toBe("dash_2");
    expect(selectedWriteResponse.json().dashboardId).toBe("dash_2");
  });
});
