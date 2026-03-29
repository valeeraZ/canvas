import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDbClient } from "../../../../../packages/db/src/index.js";
import { createApiApp } from "../../api/app";

const databaseUrl = process.env.DATABASE_URL;

const describeIfDatabase =
  databaseUrl && databaseUrl.length > 0 ? describe : describe.skip;

describeIfDatabase("dashboard routes with prisma", () => {
  const tenantId = "tenant_dashboard_integration";
  const workbookId = "wb_dashboard_fixture";
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
        slug: "tenant-dashboard-integration"
      },
      update: {
        name: "Dashboard Integration Tenant"
      },
      create: {
        id: tenantId,
        slug: "tenant-dashboard-integration",
        name: "Dashboard Integration Tenant"
      }
    });
    await prisma.dashboard.deleteMany({
      where: {
        tenantId
      }
    });
    await prisma.workbook.deleteMany({
      where: {
        tenantId
      }
    });
    await prisma.workbook.create({
      data: {
        id: workbookId,
        tenantId,
        name: "Fixture Workbook"
      }
    });
  });

  afterAll(async () => {
    await prisma.dashboard.deleteMany({
      where: {
        tenantId
      }
    });
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
