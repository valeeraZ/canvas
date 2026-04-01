import { describe, expect, it, vi } from "vitest";
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
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      principalAppPreference: {
        upsert: vi.fn().mockResolvedValue({
          principalId: "principal_1",
          tenantId: "tenant_row_1",
          selectedDashboardId: "dash_2",
          tenant: {
            slug: "canvas"
          }
        }),
        findUnique: vi.fn().mockResolvedValue({
          principalId: "principal_1",
          tenantId: "tenant_row_1",
          selectedDashboardId: "dash_2",
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as any;

    const store = createPrincipalAppPreferenceStore(prisma);

    await store.set({
      principalId: "principal_1",
      appId: "canvas",
      selectedDashboardId: "dash_2"
    });

    const result = await store.get({
      principalId: "principal_1",
      appId: "canvas"
    });

    expect(prisma.principalAppPreference.upsert).toHaveBeenCalledWith({
      where: {
        principalId_tenantId: {
          principalId: "principal_1",
          tenantId: "tenant_row_1"
        }
      },
      update: {
        selectedDashboardId: "dash_2"
      },
      create: {
        principalId: "principal_1",
        tenantId: "tenant_row_1",
        selectedDashboardId: "dash_2"
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(result?.selectedDashboardId).toBe("dash_2");
    expect(result?.appId).toBe("canvas");
  });
});
