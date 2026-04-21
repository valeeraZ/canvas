import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DatasetUploadProgressList } from "./dataset-upload-progress-provider";

describe("DatasetUploadProgressList", () => {
  it("renders upload, profiling, ready, and failed task states", () => {
    const html = renderToString(
      <DatasetUploadProgressList
        tasks={[
          {
            id: "uploading",
            datasetName: "Sales Upload",
            status: "uploading",
            progress: 45
          },
          {
            id: "profiling",
            datasetName: "Finance Upload",
            status: "profiling",
            progress: 100
          },
          {
            id: "ready",
            datasetName: "Ops Upload",
            status: "ready",
            progress: 100
          },
          {
            id: "failed",
            datasetName: "Broken Upload",
            status: "failed",
            progress: 100,
            message: "CSV import payload is empty"
          }
        ]}
      />
    );

    expect(html).toContain("Sales Upload");
    expect(html).toContain("45%");
    expect(html).toContain("Analyzing dataset schema");
    expect(html).toContain("Dataset is ready");
    expect(html).toContain("CSV import payload is empty");
  });
});
