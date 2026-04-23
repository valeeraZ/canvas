import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDbClient } from "../../../../../packages/db/src/index.js";
import { datasets, importJobs, tenants } from "../../../../../packages/db/src/schema.js";
import { createApiApp } from "../../api/app";

const databaseUrl = process.env.DATABASE_URL;

const describeIfDatabase =
  databaseUrl && databaseUrl.length > 0 ? describe : describe.skip;

describeIfDatabase("dataset routes with drizzle", () => {
  const tenantId = "tenant_integration";
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
        slug: "tenant-integration",
        name: "Integration Tenant"
      })
      .onConflictDoUpdate({
        target: tenants.slug,
        set: { name: "Integration Tenant" }
      });
    await db.delete(importJobs).where(eq(importJobs.tenantId, tenantId));
    await db.delete(datasets).where(eq(datasets.tenantId, tenantId));
  });

  afterAll(async () => {
    await db.delete(importJobs).where(eq(importJobs.tenantId, tenantId));
    await db.delete(datasets).where(eq(datasets.tenantId, tenantId));
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    await app.close();
    await db.$disconnect();
  });

  it("creates and lists persisted datasets", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/datasets/uploads",
      payload: {
        filename: "sales.csv",
        name: "Sales Upload"
      }
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json().dataset.name).toBe("Sales Upload");

    const listResponse = await app.inject({
      method: "GET",
      url: "/datasets"
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()[0]?.name).toBe("Sales Upload");
  });
});
