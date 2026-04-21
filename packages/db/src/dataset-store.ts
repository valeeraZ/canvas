import type { DatasetRecord } from "../../../packages/contracts/src/datasets.js";
import type { DatasetPreview } from "../../../packages/contracts/src/dashboard-editor.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { resolveTenantBySlug, tenantSlugInclude } from "./tenant-slug.js";

type WarningRecord = {
  code: string;
  message?: string;
};

type PersistedDataset = {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  warnings: unknown;
  preview?: unknown;
  uploadedByExternalUserId?: string | null;
  uploadedByDisplayName?: string | null;
  uploadedAt?: Date | null;
  sourceFilename?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  storageBucket?: string | null;
  storageObjectKey?: string | null;
  storageUploadId?: string | null;
  importStatus?: string | null;
  tenant?: {
    slug: string;
  } | null;
};

function normalizeWarnings(input: unknown): WarningRecord[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof item.code !== "string") {
      return [];
    }

    return [
      {
        code: item.code,
        message:
          typeof item.message === "string" ? item.message : undefined
      } satisfies WarningRecord
    ];
  });
}

export function toDatasetRecord(input: PersistedDataset): DatasetRecord {
  return {
    id: input.id,
    tenantId: input.tenant?.slug ?? input.tenantId,
    name: input.name,
    status: input.status as DatasetRecord["status"],
    warnings: normalizeWarnings(input.warnings),
    uploadedByExternalUserId: input.uploadedByExternalUserId ?? undefined,
    uploadedByDisplayName: input.uploadedByDisplayName ?? undefined,
    uploadedAt: input.uploadedAt?.toISOString(),
    sourceFilename: input.sourceFilename ?? undefined,
    contentType: input.contentType ?? undefined,
    sizeBytes: input.sizeBytes ?? undefined,
    storageBucket: input.storageBucket ?? undefined,
    storageObjectKey: input.storageObjectKey ?? undefined,
    storageUploadId: input.storageUploadId ?? undefined,
    importStatus: input.importStatus as DatasetRecord["importStatus"]
  };
}

function normalizeDatasetPreview(input: unknown): DatasetPreview | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const preview = input as Record<string, unknown>;

  if (
    typeof preview.datasetId !== "string" ||
    !Array.isArray(preview.columns) ||
    !Array.isArray(preview.sampleRows)
  ) {
    return null;
  }

  return preview as DatasetPreview;
}

export function createDatasetStore(prisma: PrismaClient) {
  return {
    async create(input: {
      tenantId: string;
      name: string;
      status?: string;
      preview?: DatasetPreview | null;
      uploadedByExternalUserId?: string;
      uploadedByDisplayName?: string;
      uploadedAt?: Date;
      sourceFilename?: string;
      contentType?: string;
      sizeBytes?: number;
      storageBucket?: string;
      storageObjectKey?: string;
      storageUploadId?: string;
      importStatus?: DatasetRecord["status"];
    }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      const dataset = await prisma.dataset.create({
        data: {
          tenantId: tenant.id,
          name: input.name,
          status: input.status ?? "queued",
          warnings: [],
          preview: input.preview ?? null,
          uploadedByExternalUserId: input.uploadedByExternalUserId,
          uploadedByDisplayName: input.uploadedByDisplayName,
          uploadedAt: input.uploadedAt,
          sourceFilename: input.sourceFilename,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          storageBucket: input.storageBucket,
          storageObjectKey: input.storageObjectKey,
          storageUploadId: input.storageUploadId,
          importStatus: input.importStatus
        },
        include: tenantSlugInclude
      });

      return toDatasetRecord(dataset);
    },
    async listByTenant(tenantId: string) {
      const datasets = await prisma.dataset.findMany({
        where: {
          tenant: {
            slug: tenantId
          }
        },
        include: tenantSlugInclude,
        orderBy: {
          name: "asc"
        }
      });

      return datasets.map(toDatasetRecord);
    },
    async findByTenantAndId(tenantId: string, datasetId: string) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: datasetId,
          tenant: {
            slug: tenantId
          }
        },
        include: tenantSlugInclude
      });

      return dataset ? toDatasetRecord(dataset) : null;
    },
    async findPreviewByTenantAndId(tenantId: string, datasetId: string) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: datasetId,
          tenant: {
            slug: tenantId
          }
        },
        select: {
          id: true,
          preview: true
        }
      });

      return dataset ? normalizeDatasetPreview(dataset.preview) : null;
    },
    async updatePreview(input: {
      tenantId: string;
      datasetId: string;
      preview: DatasetPreview | null;
    }) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: input.datasetId,
          tenant: {
            slug: input.tenantId
          }
        },
        select: {
          id: true
        }
      });

      if (!dataset) {
        return null;
      }

      await prisma.dataset.update({
        where: {
          id: input.datasetId
        },
        data: {
          preview: input.preview
        }
      });

      return input.preview;
    },
    async updateStorageMetadata(input: {
      tenantId: string;
      datasetId: string;
      contentType?: string;
      sizeBytes?: number;
      storageBucket?: string;
      storageObjectKey?: string;
      storageUploadId?: string;
      status?: DatasetRecord["status"];
      importStatus?: DatasetRecord["status"];
    }) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: input.datasetId,
          tenant: {
            slug: input.tenantId
          }
        },
        select: {
          id: true
        }
      });

      if (!dataset) {
        return null;
      }

      const updated = await prisma.dataset.update({
        where: {
          id: input.datasetId
        },
        data: {
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          storageBucket: input.storageBucket,
          storageObjectKey: input.storageObjectKey,
          storageUploadId: input.storageUploadId,
          status: input.status,
          importStatus: input.importStatus
        },
        include: tenantSlugInclude
      });

      return toDatasetRecord(updated);
    },
    async markProcessing(input: {
      tenantId: string;
      datasetId: string;
    }) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: input.datasetId,
          tenant: {
            slug: input.tenantId
          }
        },
        select: {
          id: true
        }
      });

      if (!dataset) {
        return null;
      }

      const updated = await prisma.dataset.update({
        where: {
          id: input.datasetId
        },
        data: {
          status: "processing",
          importStatus: "processing"
        },
        include: tenantSlugInclude
      });

      return toDatasetRecord(updated);
    },
    async markReady(input: {
      tenantId: string;
      datasetId: string;
      preview: DatasetPreview | null;
    }) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: input.datasetId,
          tenant: {
            slug: input.tenantId
          }
        },
        select: {
          id: true
        }
      });

      if (!dataset) {
        return null;
      }

      const updated = await prisma.dataset.update({
        where: {
          id: input.datasetId
        },
        data: {
          status: "ready",
          importStatus: "ready",
          warnings: [],
          preview: input.preview
        },
        include: tenantSlugInclude
      });

      return toDatasetRecord(updated);
    },
    async markFailed(input: {
      tenantId: string;
      datasetId: string;
      warnings: WarningRecord[];
    }) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: input.datasetId,
          tenant: {
            slug: input.tenantId
          }
        },
        select: {
          id: true
        }
      });

      if (!dataset) {
        return null;
      }

      const updated = await prisma.dataset.update({
        where: {
          id: input.datasetId
        },
        data: {
          status: "failed",
          importStatus: "failed",
          warnings: input.warnings
        },
        include: tenantSlugInclude
      });

      return toDatasetRecord(updated);
    },
    async findUsageByTenantAndId(tenantId: string, datasetId: string) {
      const dataset = await prisma.dataset.findFirst({
        where: {
          id: datasetId,
          tenant: {
            slug: tenantId
          }
        },
        select: {
          id: true
        }
      });

      if (!dataset) {
        return null;
      }

      const widgets = await prisma.dashboardWidget.findMany({
        where: {
          datasetId,
          dashboard: {
            tenant: {
              slug: tenantId
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

      const dashboards = Array.from(
        new Map(
          widgets.map((widget) => [
            widget.dashboard.id,
            {
              id: widget.dashboard.id,
              name: widget.dashboard.name
            }
          ])
        ).values()
      );

      const workbookIds = Array.from(
        new Set(
          widgets
            .map((widget) => widget.dashboard.workbookId)
            .filter((workbookId): workbookId is string => Boolean(workbookId))
        )
      );
      const workbooks = workbookIds.length
        ? await prisma.workbook.findMany({
            where: {
              id: {
                in: workbookIds
              },
              tenant: {
                slug: tenantId
              }
            },
            select: {
              id: true,
              name: true
            },
            orderBy: {
              id: "asc"
            }
          })
        : [];

      return {
        dashboards,
        widgets: widgets.map((widget) => ({
          id: widget.id,
          dashboardId: widget.dashboardId,
          dashboardName: widget.dashboard.name,
          type: widget.type
        })),
        workbooks
      };
    }
  };
}
