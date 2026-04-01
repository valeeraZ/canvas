import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { WorkbookList } from "./workbook-list";

describe("WorkbookList", () => {
  it("renders workbook rows with create and manage affordances", () => {
    const html = renderToString(
      <WorkbookList
        workbooks={[
          { id: "wb_1", name: "Executive Workbook" },
          { id: "wb_2", name: "Operations Workbook" }
        ]}
        actions={<button type="button">Create workbook</button>}
      />
    );

    expect(html).toContain("Workbook inventory");
    expect(html).toContain("Executive Workbook");
    expect(html).toContain("Operations Workbook");
    expect(html).toContain("Create workbook");
    expect(html).toContain("/portal/workbooks/wb_1");
  });
});
