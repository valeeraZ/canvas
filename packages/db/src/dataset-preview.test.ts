import { describe, expect, it } from "vitest";
import { buildDatasetPreview } from "./dataset-preview";

describe("buildDatasetPreview", () => {
  it("normalizes rows and infers simple column types", () => {
    const preview = buildDatasetPreview({
      datasetId: "ds_sales",
      headers: [" Month ", "Revenue", "Active"],
      rows: [
        ["Jan", "120", "true"],
        ["Feb", "150", "false"],
        ["Mar", "", "true"]
      ]
    });

    expect(preview.columns).toEqual([
      { name: "month", type: "string" },
      { name: "revenue", type: "number" },
      { name: "active", type: "boolean" }
    ]);
    expect(preview.sampleRows[0]).toEqual({
      month: "Jan",
      revenue: 120,
      active: true
    });
    expect(preview.records[2]).toEqual({
      month: "Mar",
      revenue: null,
      active: true
    });
  });
});
