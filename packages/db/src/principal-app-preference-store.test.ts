import { describe, expect, it } from "vitest";
import {
  createPrincipalAppPreferenceStore,
  toPrincipalAppPreference
} from "./principal-app-preference-store";

describe("toPrincipalAppPreference", () => {
  it("maps persisted preference rows", () => {
    const row = toPrincipalAppPreference({
      principalId: "principal_1",
      tenantId: "tenant_demo",
      selectedDashboardId: "dash_1"
    });

    expect(row.appId).toBe("tenant_demo");
    expect(row.selectedDashboardId).toBe("dash_1");
  });
});

describe("createPrincipalAppPreferenceStore", () => {
  it("writes preference and reads it back", async () => {
    const prisma = {
      principalAppPreference: {
        upsert: async () => ({
          principalId: "principal_1",
          tenantId: "tenant_demo",
          selectedDashboardId: "dash_2"
        }),
        findUnique: async () => ({
          principalId: "principal_1",
          tenantId: "tenant_demo",
          selectedDashboardId: "dash_2"
        })
      }
    } as any;

    const store = createPrincipalAppPreferenceStore(prisma);

    await store.set({
      principalId: "principal_1",
      appId: "tenant_demo",
      selectedDashboardId: "dash_2"
    });

    const result = await store.get({
      principalId: "principal_1",
      appId: "tenant_demo"
    });

    expect(result?.selectedDashboardId).toBe("dash_2");
  });
});
