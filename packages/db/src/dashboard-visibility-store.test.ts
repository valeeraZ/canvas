import { describe, expect, it } from "vitest";
import { toDashboardVisibilityRule } from "./dashboard-visibility-store";

describe("toDashboardVisibilityRule", () => {
  it("maps persisted visibility rows", () => {
    const rule = toDashboardVisibilityRule({
      id: "rule_1",
      tenantId: "canvas",
      dashboardId: "dash_1",
      subjectType: "user",
      subjectId: "dev-1"
    });

    expect(rule).toEqual({
      id: "rule_1",
      appId: "canvas",
      dashboardId: "dash_1",
      subjectType: "user",
      subjectId: "dev-1"
    });
  });
});
