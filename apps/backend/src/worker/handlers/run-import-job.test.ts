import { describe, expect, it } from "vitest";
import { buildImportJobPayload } from "../../../../../packages/queue/src/import-jobs";

describe("buildImportJobPayload", () => {
  it("includes the dataset and object location", () => {
    const payload = buildImportJobPayload({
      tenantId: "tenant_123",
      datasetId: "ds_1",
      objectKey: "tenant_123/uploads/sales.csv"
    });

    expect(payload.datasetId).toBe("ds_1");
  });
});
