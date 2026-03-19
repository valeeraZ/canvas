import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDbClient } from "../../../../../packages/db/src";
import { createApiApp } from "../../api/app";

const databaseUrl = process.env.DATABASE_URL;

const describeIfDatabase =
  databaseUrl && databaseUrl.length > 0 ? describe : describe.skip;

describeIfDatabase("workbook routes with prisma", () => {
  const tenantId = "tenant_workbook_integration";
  const prisma = createDbClient({
    connectionString: databaseUrl as string
  });
  const app = createApiApp({
    authBaseUrl: "http://auth.local",
    mockContext: {
      displayName: "Local Dev",
      employeeId: "dev-1",
      roles: ["ADMIN"]
    },
    db: prisma,
    tenantId
  });

  beforeAll(async () => {
    await prisma.tenant.upsert({
      where: {
        slug: "tenant-workbook-integration"
      },
      update: {
        name: "Workbook Integration Tenant"
      },
      create: {
        id: tenantId,
        slug: "tenant-workbook-integration",
        name: "Workbook Integration Tenant"
      }
    });
    await prisma.workbook.deleteMany({
      where: {
        tenantId
      }
    });
  });

  afterAll(async () => {
    await prisma.workbook.deleteMany({
      where: {
        tenantId
      }
    });
    await prisma.tenant.deleteMany({
      where: {
        id: tenantId
      }
    });
    await app.close();
    await prisma.$disconnect();
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
