import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardSharePanel } from "./dashboard-share-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("DashboardSharePanel", () => {
  it("renders editable visibility subjects", () => {
    const html = renderToString(
      <DashboardSharePanel
        dashboardId="dash_1"
        shareSubjects={[
          { type: "role", id: "ADMIN" },
          { type: "group", id: "finance" }
        ]}
      />
    );

    expect(html).toContain("Visibility subjects");
    expect(html).toContain("ADMIN");
    expect(html).toContain("Add subject");
    expect(html).toContain("Save sharing");
  });
});
