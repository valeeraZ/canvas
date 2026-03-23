import { describe, expect, it } from "vitest";
import { shareDashboard } from "./routes/share-dashboard";

describe("shareDashboard", () => {
  it("replaces dashboard visibility rules using external user ids and opaque group/role ids", async () => {
    const calls: unknown[] = [];

    const result = await shareDashboard({
      appId: "canvas",
      dashboardId: "dash_1",
      subjects: [
        { type: "user", id: "emp-42" },
        { type: "group", id: "finance" },
        { type: "role", id: "ADMIN" }
      ],
      replaceRules: async (input) => {
        calls.push(input);
        return input.rules.map((rule, index) => ({
          ...rule,
          id: `rule_${index + 1}`
        }));
      }
    });

    expect(calls).toHaveLength(1);
    expect(result.dashboardId).toBe("dash_1");
    expect(result.subjects[0]).toEqual({ type: "user", id: "emp-42" });
    expect(result.rules[1]?.subjectType).toBe("group");
    expect(result.rules[2]?.subjectId).toBe("ADMIN");
  });
});
