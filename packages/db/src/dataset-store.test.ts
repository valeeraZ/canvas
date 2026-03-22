import { describe, expect, it } from "vitest";
import { toDatasetRecord } from "./dataset-store";

describe("toDatasetRecord", () => {
  it("normalizes persisted warnings", () => {
    const record = toDatasetRecord({
      id: "ds_1",
      tenantId: "tenant_demo",
      name: "Sales Upload",
      status: "queued",
      warnings: [{ code: "trimmed_header" }]
    });

    expect(record.warnings[0]?.code).toBe("trimmed_header");
  });
});
