import { describe, expect, it } from "vitest";
import {
  createDashboardVisibilityStore,
  toDashboardVisibilityRule
} from "./dashboard-visibility-store";

describe("toDashboardVisibilityRule", () => {
  it("maps persisted visibility rows", () => {
    const row = toDashboardVisibilityRule({
      id: "rule_1",
      tenantId: "tenant_demo",
      dashboardId: "dash_1",
      subjectType: "group",
      subjectId: "finance"
    });

    expect(row.appId).toBe("tenant_demo");
    expect(row.subjectType).toBe("group");
  });
});

describe("createDashboardVisibilityStore", () => {
  it("replaces rules and returns normalized rows", async () => {
    const prisma = {
      dashboardVisibilityRule: {
        deleteMany: async () => ({ count: 1 }),
        createManyAndReturn: async () => [
          {
            id: "rule_2",
            tenantId: "tenant_demo",
            dashboardId: "dash_1",
            subjectType: "role",
            subjectId: "ADMIN"
          }
        ],
        findMany: async () => []
      }
    } as any;

    const store = createDashboardVisibilityStore(prisma);
    const result = await store.replaceRules({
      appId: "tenant_demo",
      dashboardId: "dash_1",
      rules: [
        {
          appId: "tenant_demo",
          dashboardId: "dash_1",
          subjectType: "role",
          subjectId: "ADMIN"
        }
      ]
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.subjectId).toBe("ADMIN");
  });
});
