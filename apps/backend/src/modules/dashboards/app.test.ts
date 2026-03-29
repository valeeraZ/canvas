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
  it("creates, lists, and fetches dashboards in the selected app context", async () => {
    let visibleRequest: unknown;
    let listRequest: unknown;
    let detailRequest: unknown;
    let createRequest: unknown;
    let shareRequest: unknown;
    let shareReadRequest: unknown;
    let exportRequest: unknown;
    let importRequest: unknown;
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
        listDashboards: async (tenantId: string) => {
          listRequest = tenantId;
          return [
            {
              id: "dash_1",
              tenantId,
              name: "Overview",
              workbookId: "wb_1"
            }
          ];
        },
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
        getDashboard: async (dashboardId: string, tenantId: string) => {
          detailRequest = { dashboardId, tenantId };
          return {
            id: dashboardId,
            tenantId,
            name: "Overview",
            workbookId: "wb_1"
          };
        },
        createDashboard: async (input: {
          tenantId: string;
          name: string;
          workbookId?: string;
        }) => {
          createRequest = input;
          return {
            id: "dash_1",
            tenantId: input.tenantId,
            name: input.name,
            workbookId: input.workbookId ?? null
          };
        },
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
        getDashboardShare: async (input: unknown) => {
          shareReadRequest = input;
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
        exportDashboard: async (input: unknown) => {
          exportRequest = input;
          return {
            version: 1,
            dashboard: {
              name: "Overview",
              workbookId: "wb_1"
            },
            shareSubjects: [{ type: "role", id: "ADMIN" }]
          };
        },
        importDashboard: async (input: unknown) => {
          importRequest = input;
          return {
            id: "dash_imported",
            tenantId: "canvas",
            name: "Imported Overview",
            workbookId: "wb_1"
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
    expect(listResponse.statusCode).toBe(401);

    const detailResponse = await app.inject({
      method: "GET",
      url: "/dashboards/dash_1"
    });
    expect(detailResponse.statusCode).toBe(401);

    const createResponse = await app.inject({
      method: "POST",
      url: "/dashboards",
      payload: {
        name: "Overview",
        workbookId: "wb_1"
      }
    });
    expect(createResponse.statusCode).toBe(401);

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

    const authorizedList = await app.inject({
      method: "GET",
      url: "/dashboards",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });
    expect(authorizedList.statusCode).toBe(200);
    expect((listRequest as string | undefined)).toBe("canvas");
    expect(authorizedList.json()[0]?.tenantId).toBe("canvas");

    const authorizedDetail = await app.inject({
      method: "GET",
      url: "/dashboards/dash_1",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });
    expect(authorizedDetail.statusCode).toBe(200);
    expect((detailRequest as { tenantId?: string } | undefined)?.tenantId).toBe(
      "canvas"
    );
    expect(authorizedDetail.json().id).toBe("dash_1");

    const shareReadResponse = await app.inject({
      method: "GET",
      url: "/dashboards/dash_1/share",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });
    expect(shareReadResponse.statusCode).toBe(200);
    expect((shareReadRequest as { tenantId?: string })?.tenantId).toBe("canvas");
    expect(shareReadResponse.json().subjects[0]?.id).toBe("ADMIN");

    const exportResponse = await app.inject({
      method: "GET",
      url: "/dashboards/dash_1/export",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });
    expect(exportResponse.statusCode).toBe(200);
    expect((exportRequest as { tenantId?: string })?.tenantId).toBe("canvas");
    expect(exportResponse.json().dashboard.name).toBe("Overview");

    const authorizedCreate = await app.inject({
      method: "POST",
      url: "/dashboards",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      },
      payload: {
        name: "Overview",
        workbookId: "wb_1"
      }
    });
    expect(authorizedCreate.statusCode).toBe(200);
    expect((createRequest as { tenantId?: string } | undefined)?.tenantId).toBe(
      "canvas"
    );
    expect(authorizedCreate.json().workbookId).toBe("wb_1");

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
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      },
      payload: {
        subjects: [{ type: "role", id: "ADMIN" }]
      }
    });
    expect(shareResponse.statusCode).toBe(200);
    expect((shareRequest as { dashboardId?: string })?.dashboardId).toBe("dash_1");
    expect((shareRequest as { tenantId?: string })?.tenantId).toBe("canvas");
    expect(shareResponse.json().rules[0]?.subjectId).toBe("ADMIN");

    const importResponse = await app.inject({
      method: "POST",
      url: "/dashboards/import",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      },
      payload: {
        version: 1,
        dashboard: {
          name: "Imported Overview",
          workbookId: "wb_1"
        },
        shareSubjects: [{ type: "role", id: "ADMIN" }]
      }
    });
    expect(importResponse.statusCode).toBe(200);
    expect((importRequest as { tenantId?: string })?.tenantId).toBe("canvas");
    expect(importResponse.json().id).toBe("dash_imported");

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
