import { describe, expect, it } from "vitest";
import { mapDatasetSummary } from "./list-datasets";

describe("mapDatasetSummary", () => {
  it("returns the dataset status and warning count", () => {
    const summary = mapDatasetSummary({
      id: "ds_1",
      name: "Sales Upload",
      status: "warning",
      warnings: [{ code: "mixed_type" }]
    });

    expect(summary.warningCount).toBe(1);
  });
});
