import { describe, expect, it, vi } from "vitest";
import { createDatasetStore, toDatasetRecord } from "./dataset-store";
import type { DatasetPreview } from "../../../packages/contracts/src/dashboard-editor.js";

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
    const preview: DatasetPreview = {
      datasetId: "ds_1",
      columns: [
        { name: "month", type: "string" },
        { name: "revenue", type: "number" }
      ],
      sampleRows: [{ month: "Jan", revenue: 120 }],
      records: [{ month: "Jan", revenue: 120 }]
    };
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
          preview,
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createDatasetStore(prisma);
    const dataset = await store.create({
      tenantId: "canvas",
      name: "Sales Upload",
      preview
    });

    expect(prisma.dataset.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_row_1",
        name: "Sales Upload",
        status: "queued",
        warnings: [],
        preview
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

  it("returns stored dataset preview records", async () => {
    const preview: DatasetPreview = {
      datasetId: "ds_1",
      columns: [
        { name: "month", type: "string" },
        { name: "revenue", type: "number" }
      ],
      sampleRows: [{ month: "Jan", revenue: 120 }],
      records: [{ month: "Jan", revenue: 120 }]
    };

    const prisma = {
      dataset: {
        findFirst: vi.fn().mockResolvedValue({
          id: "ds_1",
          preview
        })
      }
    } as never;

    const store = createDatasetStore(prisma);
    const result = await store.findPreviewByTenantAndId("canvas", "ds_1");

    expect(result?.records[0]?.revenue).toBe(120);
  });

  it("persists dataset storage metadata and uploader details", async () => {
    const uploadedAt = new Date("2026-04-02T10:00:00.000Z");
    const prisma = {
      tenant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "tenant_row_1",
          slug: "canvas"
        })
      },
      dataset: {
        create: vi.fn().mockResolvedValue({
          id: "ds_2",
          tenantId: "tenant_row_1",
          name: "Finance Upload",
          status: "queued",
          warnings: [],
          preview: null,
          uploadedByExternalUserId: "dev-1",
          uploadedByDisplayName: "Local Dev",
          uploadedAt,
          sourceFilename: "finance.xlsx",
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          sizeBytes: 1048576,
          storageBucket: "canvas-raw",
          storageObjectKey: "canvas/uploads/finance.xlsx",
          storageUploadId: "upload_123",
          importStatus: "queued",
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createDatasetStore(prisma);
    const dataset = await store.create({
      tenantId: "canvas",
      name: "Finance Upload",
      uploadedByExternalUserId: "dev-1",
      uploadedByDisplayName: "Local Dev",
      uploadedAt,
      sourceFilename: "finance.xlsx",
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: 1048576,
      storageBucket: "canvas-raw",
      storageObjectKey: "canvas/uploads/finance.xlsx",
      storageUploadId: "upload_123",
      importStatus: "queued"
    });

    expect(prisma.dataset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        uploadedByExternalUserId: "dev-1",
        uploadedByDisplayName: "Local Dev",
        uploadedAt,
        sourceFilename: "finance.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: 1048576,
        storageBucket: "canvas-raw",
        storageObjectKey: "canvas/uploads/finance.xlsx",
        storageUploadId: "upload_123",
        importStatus: "queued"
      }),
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(dataset.uploadedByDisplayName).toBe("Local Dev");
    expect(dataset.storageObjectKey).toBe("canvas/uploads/finance.xlsx");
  });

  it("updates stored object metadata after a file upload completes", async () => {
    const prisma = {
      dataset: {
        findFirst: vi.fn().mockResolvedValue({
          id: "ds_3"
        }),
        update: vi.fn().mockResolvedValue({
          id: "ds_3",
          tenantId: "tenant_row_1",
          name: "Sales Upload",
          status: "queued",
          warnings: [],
          preview: null,
          contentType: "text/csv",
          sizeBytes: 21,
          storageBucket: "canvas-raw",
          storageObjectKey: "canvas/uploads/sales.csv",
          storageUploadId: "s3-upload-1",
          importStatus: "queued",
          tenant: {
            slug: "canvas"
          }
        })
      }
    } as never;

    const store = createDatasetStore(prisma);
    const dataset = await store.updateStorageMetadata({
      tenantId: "canvas",
      datasetId: "ds_3",
      contentType: "text/csv",
      sizeBytes: 21,
      storageBucket: "canvas-raw",
      storageObjectKey: "canvas/uploads/sales.csv",
      storageUploadId: "s3-upload-1",
      importStatus: "queued"
    });

    expect(prisma.dataset.update).toHaveBeenCalledWith({
      where: {
        id: "ds_3"
      },
      data: {
        contentType: "text/csv",
        sizeBytes: 21,
        storageBucket: "canvas-raw",
        storageObjectKey: "canvas/uploads/sales.csv",
        storageUploadId: "s3-upload-1",
        importStatus: "queued"
      },
      include: {
        tenant: {
          select: {
            slug: true
          }
        }
      }
    });
    expect(dataset?.storageUploadId).toBe("s3-upload-1");
  });

  it("derives usage metadata from widgets, dashboards, and workbooks", async () => {
    const prisma = {
      dataset: {
        findFirst: vi.fn().mockResolvedValue({
          id: "ds_1"
        })
      },
      dashboardWidget: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "widget_1",
            type: "chart",
            dashboardId: "dash_1",
            dashboard: {
              id: "dash_1",
              name: "Executive Overview",
              workbookId: "wb_1"
            }
          },
          {
            id: "widget_2",
            type: "chart",
            dashboardId: "dash_2",
            dashboard: {
              id: "dash_2",
              name: "Forecast",
              workbookId: null
            }
          }
        ])
      },
      workbook: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "wb_1",
            name: "Revenue Planning"
          }
        ])
      }
    } as never;

    const store = createDatasetStore(prisma);
    const usage = await store.findUsageByTenantAndId("canvas", "ds_1");

    expect(prisma.dashboardWidget.findMany).toHaveBeenCalledWith({
      where: {
        datasetId: "ds_1",
        dashboard: {
          tenant: {
            slug: "canvas"
          }
        }
      },
      select: {
        id: true,
        type: true,
        dashboardId: true,
        dashboard: {
          select: {
            id: true,
            name: true,
            workbookId: true
          }
        }
      },
      orderBy: {
        id: "asc"
      }
    });
    expect(usage).toEqual({
      dashboards: [
        { id: "dash_1", name: "Executive Overview" },
        { id: "dash_2", name: "Forecast" }
      ],
      widgets: [
        {
          id: "widget_1",
          dashboardId: "dash_1",
          dashboardName: "Executive Overview",
          type: "chart"
        },
        {
          id: "widget_2",
          dashboardId: "dash_2",
          dashboardName: "Forecast",
          type: "chart"
        }
      ],
      workbooks: [{ id: "wb_1", name: "Revenue Planning" }]
    });
  });
});
