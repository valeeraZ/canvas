import { describe, expect, it, vi } from "vitest";
import { createDatasetStore, toDatasetRecord } from "./dataset-store";

describe("toDatasetRecord", () => {
  it("normalizes persisted warnings", () => {
    const record = toDatasetRecord({
      id: "ds_1",
      tenantId: "tenant_demo",
      name: "Sales Upload",
      status: "queued",
      warnings: [{ code: "trimmed_header" }]
    });

    expect(record.warnings[0]?.code).toBe("trimmed_header");
  });

  it("resolves app slug to tenant id before creating a dataset", async () => {
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dataset: {
        create: vi.fn().mockResolvedValue({
          id: "ds_1",
          tenantId: "tenant_row_1",
          name: "Sales Upload",
          status: "queued",
          warnings: [],
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createDatasetStore(prisma);
    const dataset = await store.create({
      tenantId: "canvas",
      name: "Sales Upload"
    });

    expect(prisma.dataset.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_row_1",
        name: "Sales Upload",
        status: "queued",
        warnings: []
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(dataset.tenantId).toBe("canvas");
  });
});
