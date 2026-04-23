import { describe, expect, it } from "vitest";
import { toDashboardRecord } from "./dashboard-store";

describe("toDashboardRecord", () => {
  it("normalizes a persisted dashboard", () => {
    const dashboard = toDashboardRecord({
      id: "dash_1",
      tenantId: "tenant_demo",
      name: "Overview",
      workbookId: "wb_1",
      status: "active",
      createdByExternalUserId: "dev-1",
      createdByDisplayName: "Local Dev",
      createdAt: new Date("2026-04-21T09:00:00.000Z"),
      updatedAt: new Date("2026-04-21T10:00:00.000Z")
    });

    expect(dashboard.workbookId).toBe("wb_1");
    expect(dashboard.status).toBe("active");
    expect(dashboard.author.displayName).toBe("Local Dev");
    expect(dashboard.createdAt).toBe("2026-04-21T09:00:00.000Z");
    expect(dashboard.updatedAt).toBe("2026-04-21T10:00:00.000Z");
  });
});
