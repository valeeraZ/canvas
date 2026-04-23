import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDbClient } from "../../../../../packages/db/src/index.js";
import { memberships, principals, tenants } from "../../../../../packages/db/src/schema.js";
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

describeIfDatabase("session exchange with drizzle", () => {
  const tenantSlug = "canvas-auth";
  const externalUserId = "dev-1";
  const db = createDbClient({
    connectionString: databaseUrl as string
  });
  const app = createApiApp({
    authBaseUrl: "http://auth.local",
    mockContext: {
      displayName: "Local Dev",
      employeeId: externalUserId,
      roles: ["ADMIN"]
    },
    db: db
  });

  beforeAll(async () => {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug));
    if (tenant) {
      await db.delete(memberships).where(eq(memberships.tenantId, tenant.id));
    }
    await db.delete(principals).where(eq(principals.externalUserId, externalUserId));
    await db.delete(tenants).where(eq(tenants.slug, tenantSlug));
  });

  afterAll(async () => {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug));
    if (tenant) {
      await db.delete(memberships).where(eq(memberships.tenantId, tenant.id));
    }
    await db.delete(principals).where(eq(principals.externalUserId, externalUserId));
    await db.delete(tenants).where(eq(tenants.slug, tenantSlug));
    await app.close();
    await db.$disconnect();
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

    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug));
    const [principal] = await db
      .select()
      .from(principals)
      .where(eq(principals.externalUserId, externalUserId));
    const storedMemberships =
      tenant && principal
        ? await db
            .select()
            .from(memberships)
            .where(
              and(
                eq(memberships.tenantId, tenant.id),
                eq(memberships.principalId, principal.id)
              )
            )
        : [];

    expect(tenant?.slug).toBe(tenantSlug);
    expect(principal?.externalUserId).toBe(externalUserId);
    expect(storedMemberships[0]?.role).toBe("ADMIN");

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
