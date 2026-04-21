import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardTableRenderer } from "./dashboard-table-renderer";

describe("DashboardTableRenderer", () => {
  it("renders a ready table payload with pagination summary", () => {
    const html = renderToString(
      <DashboardTableRenderer
        widget={{
          config: {
            datasetId: "ds_1",
            chartType: "table",
            columns: ["month", "revenue"],
            pageSize: 10,
            title: "Sales rows"
          }
        }}
        state={{
          status: "ready",
          payload: {
            columns: ["month", "revenue"],
            rows: [{ month: "Jan", revenue: 120 }],
            page: 2,
            pageSize: 10,
            totalRows: 21
          }
        }}
      />
    );

    expect(html).toContain("Sales rows");
    expect(html).toContain("month");
    expect(html).toContain("Jan");
    expect(html).toContain("Page 2 of 3");
    expect(html).toContain("Previous page");
    expect(html).toContain("Next page");
  });
});
