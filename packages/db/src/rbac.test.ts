import { describe, expect, it } from "vitest";
import { can } from "./rbac";

describe("can", () => {
  it("allows tenant admins to manage branding", () => {
    expect(can("tenant_admin", "branding:update")).toBe(true);
  });
});
