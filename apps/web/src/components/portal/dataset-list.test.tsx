import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DatasetList } from "./dataset-list";

describe("DatasetList", () => {
  it("renders dataset rows with upload affordance", () => {
    const html = renderToString(
      <DatasetList
        appName="frame_app"
        datasets={[
          {
            id: "ds_1",
            tenantId: "frame_app",
            name: "Sales Upload",
            status: "ready",
            warningCount: 0,
            uploadedByDisplayName: "Local Dev",
            uploadedByExternalUserId: "dev-1"
          }
        ]}
        appLabels={{ frame_app: "FRAME App" }}
        actions={<button type="button">Upload dataset</button>}
      />
    );

    expect(html).toContain("Dataset inventory");
    expect(html).toContain("Sales Upload");
    expect(html).toContain("FRAME App");
    expect(html).toContain("Local Dev (dev-1)");
    expect(html).toContain("Upload dataset");
    expect(html).toContain("/portal/frame_app/datasets/ds_1");
  });
});
