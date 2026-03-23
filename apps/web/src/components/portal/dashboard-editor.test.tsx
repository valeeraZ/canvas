import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardEditor } from "./dashboard-editor";

describe("DashboardEditor", () => {
  it("renders share and selected-dashboard forms for a dashboard", () => {
    const html = renderToString(
      <DashboardEditor
        dashboard={{ id: "dash_1", name: "Executive Overview" }}
        selectedDashboardId="dash_1"
        shareSubjects={[
          { type: "role", id: "ADMIN" },
          { type: "group", id: "finance" }
        ]}
      />
    );

    expect(html).toContain("Executive Overview");
    expect(html).toContain("/api/canvas/dashboards/dash_1/share");
    expect(html).toContain("/api/canvas/dashboards/selected-dashboard");
    expect(html).toContain("ADMIN");
  });
});
