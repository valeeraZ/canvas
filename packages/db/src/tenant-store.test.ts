import { describe, expect, it } from "vitest";
import { toTenantRecord } from "./tenant-store";

describe("toTenantRecord", () => {
  it("normalizes a persisted tenant", () => {
    const tenant = toTenantRecord({
      id: "tenant_1",
      slug: "canvas",
      name: "Canvas"
    });

    expect(tenant.slug).toBe("canvas");
  });
});
