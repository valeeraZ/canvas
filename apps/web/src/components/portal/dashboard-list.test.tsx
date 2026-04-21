import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardList } from "./dashboard-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn()
  })
}));

describe("DashboardList", () => {
  it("renders dashboard cards with management affordances", () => {
    const html = renderToString(
      <DashboardList
        dashboards={[
          {
            id: "dash_1",
            appName: "canvas",
            name: "Executive Overview",
            status: "active",
            author: {
              externalUserId: "dev-1",
              displayName: "Local Dev"
            },
            createdAt: "2026-04-21T09:00:00.000Z",
            updatedAt: "2026-04-21T10:00:00.000Z"
          },
          {
            id: "dash_2",
            appName: "canvas",
            name: "Finance Drilldown",
            status: "active",
            author: {
              externalUserId: "dev-2",
              displayName: "Ada Lovelace"
            },
            createdAt: "2026-04-20T09:00:00.000Z",
            updatedAt: "2026-04-20T10:00:00.000Z"
          }
        ]}
        selectedDashboardId="dash_1"
        showDefaultEmbed
        actions={<button type="button">Create dashboard</button>}
      />
    );

    expect(html).toContain("Dashboard inventory");
    expect(html).toContain("Executive Overview");
    expect(html).toContain("Finance Drilldown");
    expect(html).toContain("/portal/canvas/dash_1");
    expect(html).toContain("Local Dev");
    expect(html).toContain("Default embed");
    expect(html).toContain("Executive Overview actions");
    expect(html).toContain("Finance Drilldown actions");
    expect(html).toContain("text-green-600");
    expect(html).toContain("text-muted-foreground/35");
    expect(html).toContain("Create dashboard");
  });
});
