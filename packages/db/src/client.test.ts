import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDbClient } from "./client";
import { tenants } from "./schema";

describe("createDbClient", () => {
  it("returns a drizzle client with lifecycle compatibility methods", async () => {
    const client = createDbClient({
      connectionString: "postgres://canvas:canvas@localhost:5432/canvas"
    });

    expect(typeof client.select).toBe("function");
    expect(typeof client.insert).toBe("function");
    expect(typeof client.transaction).toBe("function");
    expect(getTableName(tenants)).toBe("Tenant");
    expect(typeof client.query.tenants.findFirst).toBe("function");
    expect(typeof client.$connect).toBe("function");
    expect(typeof client.$disconnect).toBe("function");

    await expect(client.$connect()).resolves.toBeUndefined();
    await expect(client.$disconnect()).resolves.toBeUndefined();
  });
});
