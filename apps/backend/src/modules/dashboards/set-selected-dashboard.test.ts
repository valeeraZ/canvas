import { describe, expect, it } from "vitest";
import {
  getSelectedDashboard,
  setSelectedDashboard
} from "./routes/set-selected-dashboard";

describe("getSelectedDashboard", () => {
  it("returns null when the user has no saved selection", async () => {
    const result = await getSelectedDashboard({
      appId: "canvas",
      externalUserId: "emp-42",
      findPrincipalByExternalUserId: async () => null,
      getPreference: async () => null
    });

    expect(result.dashboardId).toBeNull();
  });
});

describe("setSelectedDashboard", () => {
  it("upserts principal preference for the active app", async () => {
    const result = await setSelectedDashboard({
      appId: "canvas",
      externalUserId: "emp-42",
      dashboardId: "dash_7",
      upsertPrincipal: async () => ({
        id: "principal_1",
        externalUserId: "emp-42"
      }),
      setPreference: async (input) => input
    });

    expect(result.dashboardId).toBe("dash_7");
  });
});
