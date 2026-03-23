import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardList } from "./dashboard-list";

describe("DashboardList", () => {
  it("renders dashboard titles and selected state", () => {
    const html = renderToString(
      <DashboardList
        dashboards={[
          { id: "dash_1", name: "Executive Overview" },
          { id: "dash_2", name: "Finance Drilldown" }
        ]}
        selectedDashboardId="dash_1"
      />
    );

    expect(html).toContain("Executive Overview");
    expect(html).toContain("Finance Drilldown");
    expect(html).toContain("Selected for Embed");
  });
});
