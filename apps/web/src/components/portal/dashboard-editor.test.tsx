import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardEditor } from "./dashboard-editor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("DashboardEditor", () => {
  it("renders a management view for one dashboard", () => {
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

    expect(html).not.toContain("Executive Overview");
    expect(html).not.toContain("Back to dashboards");
    expect(html).toContain("Dashboard workspace");
    expect(html).toContain("View dashboard");
    expect(html).toContain("Edit tools");
    expect(html).toContain("Dashboard ID:");
    expect(html).toContain("dash_1");
    expect(html).toContain("Selected for embed");
    expect(html).toContain("Export dashboard");
  });
});
