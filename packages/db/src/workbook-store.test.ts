import { describe, expect, it, vi } from "vitest";
import { createWorkbookStore, toWorkbookRecord } from "./workbook-store";

describe("toWorkbookRecord", () => {
  it("normalizes a persisted workbook", () => {
    const workbook = toWorkbookRecord({
      id: "wb_1",
      tenantId: "tenant_demo",
      name: "Sales Workbook"
    });

    expect(workbook.name).toBe("Sales Workbook");
  });

  it("resolves app slug to tenant id before creating a workbook", async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      workbook: {
        create: vi.fn().mockResolvedValue({
          id: "wb_1",
          tenantId: "tenant_row_1",
          name: "Sales Workbook",
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createWorkbookStore(prisma);
    const workbook = await store.create({
      tenantId: "canvas",
      name: "Sales Workbook"
    });

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: {
        slug: "canvas"
      },
      select: {
        id: true,
        slug: true
      }
    });
    expect(prisma.workbook.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_row_1",
        name: "Sales Workbook"
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(workbook.tenantId).toBe("canvas");
  });
});
