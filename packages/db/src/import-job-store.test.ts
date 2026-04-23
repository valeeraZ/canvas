import { describe, expect, it } from "vitest";
import { toImportJobRecord } from "./import-job-store";

describe("toImportJobRecord", () => {
  it("normalizes persisted warning records", () => {
    const job = toImportJobRecord({
      id: "job_1",
      datasetId: "dataset_1",
      tenantId: "tenant_1",
      status: "failed",
      objectKey: "uploads/file.csv",
      warnings: [{ code: "invalid-row", message: "Row 2 failed" }, { code: 1 }]
    });

    expect(job).toMatchObject({
      id: "job_1",
      datasetId: "dataset_1",
      tenantId: "tenant_1",
      status: "failed",
      objectKey: "uploads/file.csv",
      warnings: [{ code: "invalid-row", message: "Row 2 failed" }]
    });
  });
});
