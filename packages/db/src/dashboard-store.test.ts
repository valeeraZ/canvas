import { describe, expect, it, vi } from "vitest";
import { createDashboardStore, toDashboardRecord } from "./dashboard-store";

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
          status: "active",
          createdByExternalUserId: "dev-1",
          createdByDisplayName: "Local Dev",
          createdAt: new Date("2026-04-21T09:00:00.000Z"),
          updatedAt: new Date("2026-04-21T09:00:00.000Z"),
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createDashboardStore(prisma);
    const dashboard = await store.create({
      tenantId: "canvas",
      name: "Overview",
      createdByExternalUserId: "dev-1",
      createdByDisplayName: "Local Dev"
    });

    expect(prisma.dashboard.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_row_1",
        name: "Overview",
        workbookId: null,
        status: "active",
        createdByExternalUserId: "dev-1",
        createdByDisplayName: "Local Dev"
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
    expect(dashboard.author.displayName).toBe("Local Dev");
  });

  it("renames a dashboard within an app", async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dashboard: {
        update: vi.fn().mockResolvedValue({
          id: "dash_1",
          tenantId: "tenant_row_1",
          name: "Renamed Overview",
          workbookId: null,
          status: "active",
          createdByExternalUserId: "dev-1",
          createdByDisplayName: "Local Dev",
          createdAt: new Date("2026-04-21T09:00:00.000Z"),
          updatedAt: new Date("2026-04-21T10:00:00.000Z"),
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createDashboardStore(prisma);
    const dashboard = await store.rename({
      tenantId: "canvas",
      dashboardId: "dash_1",
      name: "Renamed Overview"
    });

    expect(prisma.dashboard.update).toHaveBeenCalledWith({
      where: {
        id: "dash_1",
        tenantId: "tenant_row_1"
      },
      data: {
        name: "Renamed Overview"
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(dashboard?.name).toBe("Renamed Overview");
  });

  it("removes a dashboard within an app", async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dashboard: {
        delete: vi.fn().mockResolvedValue({
          id: "dash_1"
        })
      }
    } as never;

    const store = createDashboardStore(prisma);
    const result = await store.remove({
      tenantId: "canvas",
      dashboardId: "dash_1"
    });

    expect(prisma.dashboard.delete).toHaveBeenCalledWith({
      where: {
        id: "dash_1",
        tenantId: "tenant_row_1"
      }
    });
    expect(result).toEqual({
      deletedDashboardId: "dash_1"
    });
  });
});
