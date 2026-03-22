import { describe, expect, it } from "vitest";
import { createDbClient } from "./client";

describe("createDbClient", () => {
  it("returns a client that can disconnect", async () => {
    const client = createDbClient({
      connectionString: "postgres://canvas:canvas@localhost:5432/canvas"
    });

    expect(typeof client.$disconnect).toBe("function");

    await expect(client.$disconnect()).resolves.toBeUndefined();
  });
});
