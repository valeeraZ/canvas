import { describe, expect, it, vi } from "vitest";
import { createDashboardStore, toDashboardRecord } from "./dashboard-store";

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

  it("resolves app slug to tenant id before creating a dashboard", async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dashboard: {
        create: vi.fn().mockResolvedValue({
          id: "dash_1",
          tenantId: "tenant_row_1",
          name: "Overview",
          workbookId: null,
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createDashboardStore(prisma);
    const dashboard = await store.create({
      tenantId: "canvas",
      name: "Overview"
    });

    expect(prisma.dashboard.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_row_1",
        name: "Overview",
        workbookId: null
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(dashboard.tenantId).toBe("canvas");
  });
});
