import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDbClient } from "../../../../../packages/db/src";
import { createApiApp } from "../../api/app";

const databaseUrl = process.env.DATABASE_URL;

const describeIfDatabase =
  databaseUrl && databaseUrl.length > 0 ? describe : describe.skip;

function readSessionCookie(value: string | string[] | undefined) {
  if (!value) {
    return "";
  }

  const cookie = Array.isArray(value) ? value[0] : value;
  return cookie.split(";")[0] ?? "";
}

describeIfDatabase("session exchange with prisma", () => {
  const tenantSlug = "canvas-auth";
  const externalUserId = "dev-1";
  const prisma = createDbClient({
    connectionString: databaseUrl as string
  });
  const app = createApiApp({
    authBaseUrl: "http://auth.local",
    mockContext: {
      displayName: "Local Dev",
      employeeId: externalUserId,
      roles: ["ADMIN"]
    },
    db: prisma
  });

  beforeAll(async () => {
    await prisma.membership.deleteMany({
      where: {
        tenant: {
          slug: tenantSlug
        }
      }
    });
    await prisma.principal.deleteMany({
      where: {
        externalUserId
      }
    });
    await prisma.tenant.deleteMany({
      where: {
        slug: tenantSlug
      }
    });
  });

  afterAll(async () => {
    await prisma.membership.deleteMany({
      where: {
        tenant: {
          slug: tenantSlug
        }
      }
    });
    await prisma.principal.deleteMany({
      where: {
        externalUserId
      }
    });
    await prisma.tenant.deleteMany({
      where: {
        slug: tenantSlug
      }
    });
    await app.close();
    await prisma.$disconnect();
  });

  it("persists tenant identities and returns tenant context", async () => {
    const session = await app.inject({
      method: "POST",
      url: "/session/exchange",
      payload: {
        token: "local-dev-token",
        appName: tenantSlug
      }
    });

    expect(session.statusCode).toBe(200);

    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: tenantSlug
      }
    });
    const principal = await prisma.principal.findUnique({
      where: {
        externalUserId
      }
    });
    const memberships = await prisma.membership.findMany({
      where: {
        tenantId: tenant?.id,
        principalId: principal?.id
      }
    });

    expect(tenant?.slug).toBe(tenantSlug);
    expect(principal?.externalUserId).toBe(externalUserId);
    expect(memberships[0]?.role).toBe("ADMIN");

    const auth = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: {
        authorization: "Bearer local-dev-token",
        cookie: readSessionCookie(session.headers["set-cookie"])
      }
    });

    expect(auth.statusCode).toBe(200);
    expect(auth.json().tenantId).toBe(tenantSlug);
    expect(auth.json().roles).toContain("ADMIN");
  });
});
