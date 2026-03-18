import { describe, expect, it } from "vitest";
import { assertTenantContext } from "./tenant-context";

describe("assertTenantContext", () => {
  it("throws when tenant context is missing", () => {
    expect(() => assertTenantContext(undefined)).toThrow("Missing tenant context");
  });
});
