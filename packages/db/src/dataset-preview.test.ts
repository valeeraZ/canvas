import { describe, expect, it } from "vitest";
import { buildDatasetPreview } from "./dataset-preview";

describe("buildDatasetPreview", () => {
  it("builds preview records from typed rows and infers date-aware column types", () => {
    const preview = buildDatasetPreview({
      datasetId: "ds_sales",
      headers: [" Month ", "Revenue", "Active"],
      rows: [
        ["2026-04-01", 120, true],
        ["2026-04-02", 150, false],
        ["2026-04-03", null, true]
      ]
    });

    expect(preview.columns).toEqual([
      { name: "month", type: "date" },
      { name: "revenue", type: "number" },
      { name: "active", type: "boolean" }
    ]);
    expect(preview.sampleRows[0]).toEqual({
      month: "2026-04-01",
      revenue: 120,
      active: true
    });
    expect(preview.sampleRows[2]).toEqual({
      month: "2026-04-03",
      revenue: null,
      active: true
    });
    expect("records" in preview).toBe(false);
  });
});
