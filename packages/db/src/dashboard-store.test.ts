import { describe, expect, it } from "vitest";
import { toDashboardRecord } from "./dashboard-store";

describe("toDashboardRecord", () => {
  it("normalizes a persisted dashboard", () => {
    const dashboard = toDashboardRecord({
      id: "dash_1",
      tenantId: "tenant_demo",
      name: "Overview",
      workbookId: "wb_1"
    });

    expect(dashboard.workbookId).toBe("wb_1");
  });
});
