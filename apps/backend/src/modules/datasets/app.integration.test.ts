import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDbClient } from "../../../../../packages/db/src";
import { createApiApp } from "../../api/app";

const databaseUrl = process.env.DATABASE_URL;

const describeIfDatabase =
  databaseUrl && databaseUrl.length > 0 ? describe : describe.skip;

describeIfDatabase("dataset routes with prisma", () => {
  const tenantId = "tenant_integration";
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
    await prisma.importJob.deleteMany({
      where: {
        tenantId
      }
    });
    await prisma.dataset.deleteMany({
      where: {
        tenantId
      }
    });
  });

  afterAll(async () => {
    await prisma.importJob.deleteMany({
      where: {
        tenantId
      }
    });
    await prisma.dataset.deleteMany({
      where: {
        tenantId
      }
    });
    await app.close();
    await prisma.$disconnect();
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
