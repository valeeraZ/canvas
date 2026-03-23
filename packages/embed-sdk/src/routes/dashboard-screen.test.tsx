import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardScreen } from "./dashboard-screen";

describe("DashboardScreen", () => {
  it("renders the viewer-first dashboard picker surface", () => {
    const html = renderToString(
      <DashboardScreen
        dashboards={[
          { id: "dash_1", name: "Executive Overview" },
          { id: "dash_2", name: "Finance Drilldown" }
        ]}
        selectedDashboardId="dash_2"
      />
    );

    expect(html).toContain("My Dashboards");
    expect(html).toContain("Finance Drilldown");
    expect(html).toContain("Selected");
  });
});
