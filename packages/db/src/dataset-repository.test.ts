import { describe, expect, it } from "vitest";
import { buildDatasetRecord } from "./dataset-repository";

describe("buildDatasetRecord", () => {
  it("creates tenant-scoped dataset metadata", () => {
    const dataset = buildDatasetRecord({
      tenantId: "tenant_123",
      name: "Sales Upload"
    });

    expect(dataset.tenantId).toBe("tenant_123");
    expect(dataset.name).toBe("Sales Upload");
  });
});
