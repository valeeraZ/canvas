import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardList } from "./dashboard-list";

describe("DashboardList", () => {
  it("renders dashboard cards with management affordances", () => {
    const html = renderToString(
      <DashboardList
        appName="canvas"
        dashboards={[
          { id: "dash_1", name: "Executive Overview" },
          { id: "dash_2", name: "Finance Drilldown" }
        ]}
        selectedDashboardId="dash_1"
        actions={<button type="button">Create dashboard</button>}
      />
    );

    expect(html).toContain("Dashboard inventory");
    expect(html).toContain("Executive Overview");
    expect(html).toContain("Finance Drilldown");
    expect(html).toContain("/portal/canvas/dash_1");
    expect(html).toContain("Selected for embed");
    expect(html).toContain("Create dashboard");
  });
});
