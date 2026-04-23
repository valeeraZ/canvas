import { describe, expect, it } from "vitest";
import { toPrincipalAppPreference } from "./principal-app-preference-store";

describe("toPrincipalAppPreference", () => {
  it("maps persisted preference rows", () => {
    const preference = toPrincipalAppPreference({
      principalId: "principal_1",
      tenantId: "tenant_row_1",
      selectedDashboardId: "dash_1",
      tenant: {
        slug: "canvas"
      }
    });

    expect(preference).toEqual({
      principalId: "principal_1",
      appId: "canvas",
      selectedDashboardId: "dash_1"
    });
  });
});
