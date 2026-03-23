import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardPicker } from "./dashboard-picker";

describe("DashboardPicker", () => {
  it("renders visible dashboards and selected label", () => {
    const html = renderToString(
      <DashboardPicker
        dashboards={[
          { id: "dash_1", name: "Executive Overview" },
          { id: "dash_2", name: "Finance Drilldown" }
        ]}
        selectedDashboardId="dash_1"
        onSelect={() => undefined}
      />
    );

    expect(html).toContain("Executive Overview");
    expect(html).toContain("Finance Drilldown");
    expect(html).toContain("Selected");
  });
});
