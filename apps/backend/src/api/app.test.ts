import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "./app";

const apps: Array<ReturnType<typeof createApiApp>> = [];

afterEach(async () => {
  while (apps.length > 0) {
    await apps.pop()?.close();
  }
});

describe("createApiApp", () => {
  it("registers health and session exchange routes", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      }
    });

    apps.push(app);

    const health = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: "canvas"
      }
    });

    expect(session.statusCode).toBe(200);
    expect(session.json().selectedApp).toBe("canvas");
    expect(session.headers["set-cookie"]).toBeTruthy();
  });

  it("serves OpenAPI json and Swagger UI", async () => {
    const app = createApiApp({
      authBaseUrl: "http://auth.local",
      mockContext: {
        displayName: "Local Dev",
        employeeId: "dev-1",
        roles: ["ADMIN"]
      },
      datasets: {
        listDatasets: async () => [],
        getDataset: async () => null,
        createUpload: async () => ({
          upload: {
            bucket: "uploads",
            objectKey: "tenant_demo/file.csv"
          },
          dataset: {
            id: "dataset_1",
            tenantId: "tenant_demo",
            name: "Dataset Upload",
            status: "queued",
            warnings: []
          }
        })
      },
      workbooks: {
        listWorkbooks: async () => [],
        getWorkbook: async () => null,
        createWorkbook: async () => ({
          id: "workbook_1",
          tenantId: "tenant_demo",
          name: "Workbook"
        })
      },
      dashboards: {
        listDashboards: async () => [],
        listVisibleDashboards: async () => [],
        getDashboard: async () => null,
        createDashboard: async () => ({
          id: "dashboard_1",
          tenantId: "tenant_demo",
          name: "Dashboard",
          workbookId: null
        }),
        shareDashboard: async () => ({
          dashboardId: "dashboard_1",
          subjects: [],
          rules: []
        }),
        getSelectedDashboard: async () => ({
          dashboardId: null
        }),
        setSelectedDashboard: async () => ({
          dashboardId: null
        })
      }
    });

    apps.push(app);

    const openapi = await app.inject({
      method: "GET",
      url: "/openapi.json"
    });

    expect(openapi.statusCode).toBe(200);
    expect(openapi.json()).toMatchObject({
      openapi: expect.any(String),
      info: {
        title: "Canvas API",
        description: expect.stringContaining("amtoken")
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      },
      servers: [
        {
          url: "/"
        }
      ],
      tags: expect.arrayContaining([
        expect.objectContaining({
          name: "session",
          description: expect.stringMatching(/server session/i)
        }),
        expect.objectContaining({
          name: "dashboards",
          description: expect.stringMatching(/dashboard/i)
        })
      ]),
      paths: expect.any(Object)
    });

    expect(openapi.json().paths["/auth/me"].get.security).toEqual([
      {
        bearerAuth: []
      }
    ]);
    expect(
      openapi.json().paths["/auth/me"].get.responses["401"].content["application/json"].schema
    ).toMatchObject({
      type: "object",
      description: expect.stringContaining("error"),
      properties: {
        message: {
          description: expect.stringContaining("message"),
          type: "string"
        }
      },
      required: ["message"]
    });
    expect(openapi.json().paths["/auth/me"].get.description).toContain(
      "Authorization: Bearer <amtoken>"
    );
    expect(
      openapi.json().paths["/session/exchange"].post.description
    ).toContain("canvas_session");
    expect(
      openapi.json().paths["/workbooks"].get.responses["200"].content["application/json"].schema
    ).toMatchObject({
      type: "array",
      items: {
        type: "object",
        description: expect.stringContaining("Workbook"),
        properties: {
          id: {
            type: "string"
          },
          tenantId: {
            type: "string"
          },
          name: {
            type: "string"
          }
        },
        required: ["id", "tenantId", "name"]
      }
    });
    expect(
      openapi.json().paths["/dashboards/{dashboardId}"].get.responses["200"].content["application/json"].schema
    ).toMatchObject({
      type: "object",
      properties: {
        id: {
          type: "string"
        },
        tenantId: {
          type: "string"
        },
        name: {
          type: "string"
        },
        workbookId: {
          type: expect.arrayContaining(["string", "null"])
        }
      },
      required: ["id", "tenantId", "name", "workbookId"]
    });
    expect(
      openapi.json().paths["/datasets"].get.responses["200"].content["application/json"].schema
    ).toMatchObject({
      type: "array",
      items: {
        type: "object",
        description: expect.stringContaining("Dataset"),
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string"
          },
          status: {
            type: "string"
          },
          warningCount: {
            type: "number"
          }
        },
        required: ["id", "name", "status", "warningCount"]
      }
    });

    const docs = await app.inject({
      method: "GET",
      url: "/docs"
    });

    expect(docs.statusCode).toBe(200);
    expect(docs.headers["content-type"]).toContain("text/html");
  });
});
