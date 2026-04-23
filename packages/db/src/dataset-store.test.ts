import { describe, expect, it } from "vitest";
import { toDatasetRecord } from "./dataset-store";

describe("toDatasetRecord", () => {
  it("normalizes persisted warnings and app slug", () => {
    const uploadedAt = new Date("2026-04-02T10:00:00.000Z");
    const record = toDatasetRecord({
      id: "ds_1",
      tenantId: "tenant_demo",
      name: "Sales Upload",
      status: "queued",
      warnings: [{ code: "trimmed_header" }, { code: 1 }],
      uploadedByDisplayName: "Local Dev",
      uploadedAt,
      storageObjectKey: "canvas/uploads/sales.csv",
      importStatus: "queued",
      tenant: {
        slug: "canvas"
      }
    });

    expect(record).toMatchObject({
      id: "ds_1",
      tenantId: "canvas",
      name: "Sales Upload",
      status: "queued",
      warnings: [{ code: "trimmed_header" }],
      uploadedByDisplayName: "Local Dev",
      uploadedAt: "2026-04-02T10:00:00.000Z",
      storageObjectKey: "canvas/uploads/sales.csv",
      importStatus: "queued"
    });
  });
});
