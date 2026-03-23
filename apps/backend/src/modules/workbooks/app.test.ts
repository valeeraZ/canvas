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

describe("workbook routes", () => {
  it("creates, lists, and fetches workbooks inside the selected app", async () => {
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
      workbooks: {
        listWorkbooks: async (tenantId?: string) => {
          listRequest = tenantId;
          return [
          {
            id: "wb_1",
            tenantId: tenantId ?? "tenant_demo",
            name: "Sales Workbook"
          }
        ];
        },
        getWorkbook: async (workbookId: string, tenantId?: string) => {
          detailRequest = {
            workbookId,
            tenantId
          };
          return {
          id: workbookId,
          tenantId: tenantId ?? "tenant_demo",
          name: "Sales Workbook"
          };
        },
        createWorkbook: async (input: { name: string; tenantId?: string }) => {
          createRequest = input;
          return {
          id: "wb_1",
          tenantId: input.tenantId ?? "tenant_demo",
          name: input.name
          };
        }
      }
    });

    apps.push(app);

    const unauthenticated = await app.inject({ method: "GET", url: "/workbooks" });
    expect(unauthenticated.statusCode).toBe(401);

    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: "canvas-books"
      }
    });

    const authHeaders = {
      authorization: "Bearer local-dev-token",
      cookie: readSessionCookie(session.headers["set-cookie"])
    };

    const listResponse = await app.inject({
      method: "GET",
      url: "/workbooks",
      headers: authHeaders
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.id).toBe("wb_1");
    expect(listRequest).toBe("canvas-books");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/workbooks/wb_1",
      headers: authHeaders
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().id).toBe("wb_1");
    expect((detailRequest as { tenantId?: string })?.tenantId).toBe("canvas-books");

    const createResponse = await app.inject({
      method: "POST",
      url: "/workbooks",
      headers: authHeaders,
      payload: {
        name: "Sales Workbook"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().name).toBe("Sales Workbook");
    expect((createRequest as { tenantId?: string })?.tenantId).toBe("canvas-books");
  });
});
