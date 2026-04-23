import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDbClient } from "../../../../../packages/db/src/index.js";
import { dashboards, tenants, workbooks } from "../../../../../packages/db/src/schema.js";
import { createApiApp } from "../../api/app";

const databaseUrl = process.env.DATABASE_URL;

const describeIfDatabase =
  databaseUrl && databaseUrl.length > 0 ? describe : describe.skip;

describeIfDatabase("dashboard routes with drizzle", () => {
  const tenantId = "tenant_dashboard_integration";
  const workbookId = "wb_dashboard_fixture";
  const db = createDbClient({
    connectionString: databaseUrl as string
  });
  const app = createApiApp({
    authBaseUrl: "http://auth.local",
    mockContext: {
      displayName: "Local Dev",
      employeeId: "dev-1",
      roles: ["ADMIN"]
    },
    db: db,
    tenantId
  });

  beforeAll(async () => {
    await db
      .insert(tenants)
      .values({
        id: tenantId,
        slug: "tenant-dashboard-integration",
        name: "Dashboard Integration Tenant"
      })
      .onConflictDoUpdate({
        target: tenants.slug,
        set: { name: "Dashboard Integration Tenant" }
      });
    await db.delete(dashboards).where(eq(dashboards.tenantId, tenantId));
    await db.delete(workbooks).where(eq(workbooks.tenantId, tenantId));
    await db.insert(workbooks).values({
        id: workbookId,
        tenantId,
        name: "Fixture Workbook"
    });
  });

  afterAll(async () => {
    await db.delete(dashboards).where(eq(dashboards.tenantId, tenantId));
    await db.delete(workbooks).where(eq(workbooks.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    await app.close();
    await db.$disconnect();
  });

  it("creates and lists persisted dashboards", async () => {
    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: tenantId
      }
    });

    const headers = {
      authorization: "Bearer local-dev-token",
      cookie: (session.headers["set-cookie"] as string).split(";")[0] ?? ""
    };

    const createResponse = await app.inject({
      method: "POST",
      url: "/dashboards",
      headers,
      payload: {
        name: "Overview",
        workbookId
      }
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().name).toBe("Overview");
    expect(createResponse.json().workbookId).toBe(workbookId);

    const listResponse = await app.inject({
      method: "GET",
      url: "/dashboards",
      headers
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.name).toBe("Overview");

    const detailResponse = await app.inject({
      method: "GET",
      url: `/dashboards/${createResponse.json().id as string}`,
      headers
    });

    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().name).toBe("Overview");
  });
});
