import { describe, expect, it } from "vitest";
import { buildUploadPreview } from "./build-upload-preview";

describe("buildUploadPreview", () => {
  it("builds a normalized preview from csv content", () => {
    const preview = buildUploadPreview({
      datasetId: "ds_1",
      filename: "sales.csv",
      content: "Month,Revenue,Active\nJan,120,true\nFeb,150,false"
    });

    expect(preview?.columns).toEqual([
      { name: "month", type: "string" },
      { name: "revenue", type: "number" },
      { name: "active", type: "boolean" }
    ]);
    expect(preview?.records[1]).toEqual({
      month: "Feb",
      revenue: 150,
      active: false
    });
  });

  it("returns null when no inline content is available", () => {
    const preview = buildUploadPreview({
      datasetId: "ds_1",
      filename: "sales.csv"
    });

    expect(preview).toBeNull();
  });
});
