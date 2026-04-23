import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDbClient } from "../../../../../packages/db/src/index.js";
import { tenants, workbooks } from "../../../../../packages/db/src/schema.js";
import { createApiApp } from "../../api/app";

const databaseUrl = process.env.DATABASE_URL;

const describeIfDatabase =
  databaseUrl && databaseUrl.length > 0 ? describe : describe.skip;

describeIfDatabase("workbook routes with drizzle", () => {
  const tenantId = "tenant_workbook_integration";
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
        slug: "tenant-workbook-integration",
        name: "Workbook Integration Tenant"
      })
      .onConflictDoUpdate({
        target: tenants.slug,
        set: { name: "Workbook Integration Tenant" }
      });
    await db.delete(workbooks).where(eq(workbooks.tenantId, tenantId));
  });

  afterAll(async () => {
    await db.delete(workbooks).where(eq(workbooks.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    await app.close();
    await db.$disconnect();
  });

  it("creates and lists persisted workbooks", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/workbooks",
      payload: {
        name: "Sales Workbook"
      }
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().name).toBe("Sales Workbook");

    const listResponse = await app.inject({
      method: "GET",
      url: "/workbooks"
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.name).toBe("Sales Workbook");

    const detailResponse = await app.inject({
      method: "GET",
      url: `/workbooks/${createResponse.json().id as string}`
    });

    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().name).toBe("Sales Workbook");
  });
});
