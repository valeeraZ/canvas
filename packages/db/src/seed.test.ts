import { describe, expect, it } from "vitest";
import { buildSeedTenant } from "./seed";

describe("buildSeedTenant", () => {
  it("creates a default development tenant", () => {
    expect(buildSeedTenant().slug).toBe("demo");
  });
});
