import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DatasetDetail } from "./dataset-detail";

describe("DatasetDetail", () => {
  it("renders metadata and usage summaries", () => {
    const html = renderToString(
      <DatasetDetail
        dataset={{
          id: "ds_1",
          name: "Sales Upload",
          status: "queued",
          uploadedByDisplayName: "Local Dev",
          sourceFilename: "sales.csv",
          contentType: "text/csv",
          sizeBytes: 256,
          importStatus: "queued",
          usageSummary: {
            dashboards: [{ id: "dash_1", name: "Executive Overview" }],
            widgets: [
              {
                id: "widget_1",
                dashboardId: "dash_1",
                dashboardName: "Executive Overview",
                type: "chart"
              }
            ],
            workbooks: []
          }
        }}
      />
    );

    expect(html).toContain("Dataset metadata");
    expect(html).toContain("Local Dev");
    expect(html).toContain("sales.csv");
    expect(html).toContain("Executive Overview");
  });
});
