import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DatasetList } from "./dataset-list";

describe("DatasetList", () => {
  it("renders dataset rows with upload affordance", () => {
    const html = renderToString(
      <DatasetList
        datasets={[
          {
            id: "ds_1",
            name: "Sales Upload",
            status: "ready",
            warningCount: 0
          }
        ]}
        actions={<button type="button">Upload dataset</button>}
      />
    );

    expect(html).toContain("Dataset inventory");
    expect(html).toContain("Sales Upload");
    expect(html).toContain("Upload dataset");
  });
});
