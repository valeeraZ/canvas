import type { DatasetRecord } from "../../../packages/contracts/src/datasets.js";
import type { DatasetPreview } from "../../../packages/contracts/src/dashboard-editor.js";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { dashboardWidgets, dashboards, datasets, tenants, workbooks } from "./schema.js";
import { resolveTenantBySlug } from "./tenant-slug.js";

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

function datasetSelection() {
  return {
    id: datasets.id,
    tenantId: datasets.tenantId,
    name: datasets.name,
    status: datasets.status,
    warnings: datasets.warnings,
    preview: datasets.preview,
    uploadedByExternalUserId: datasets.uploadedByExternalUserId,
    uploadedByDisplayName: datasets.uploadedByDisplayName,
    uploadedAt: datasets.uploadedAt,
    sourceFilename: datasets.sourceFilename,
    contentType: datasets.contentType,
    sizeBytes: datasets.sizeBytes,
    storageBucket: datasets.storageBucket,
    storageObjectKey: datasets.storageObjectKey,
    storageUploadId: datasets.storageUploadId,
    importStatus: datasets.importStatus,
    tenantSlug: tenants.slug
  };
}

function toDatasetRecordWithSlug(
  input: Omit<PersistedDataset, "tenant"> & { tenantSlug: string }
) {
  return toDatasetRecord({
    ...input,
    tenant: { slug: input.tenantSlug }
  });
}

async function findDatasetIdByTenant(
  db: DbClient,
  input: { tenantId: string; datasetId: string }
) {
  const [dataset] = await db
    .select({ id: datasets.id })
    .from(datasets)
    .innerJoin(tenants, eq(datasets.tenantId, tenants.id))
    .where(and(eq(datasets.id, input.datasetId), eq(tenants.slug, input.tenantId)))
    .limit(1);

  return dataset?.id ?? null;
}

export function createDatasetStore(db: DbClient) {
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
      const tenant = await resolveTenantBySlug(db, input.tenantId);
      const [dataset] = await db
        .insert(datasets)
        .values({
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
        })
        .returning();

      return toDatasetRecord({ ...dataset, tenant: { slug: tenant.slug } });
    },
    async listByTenant(tenantId: string) {
      const rows = await db
        .select(datasetSelection())
        .from(datasets)
        .innerJoin(tenants, eq(datasets.tenantId, tenants.id))
        .where(eq(tenants.slug, tenantId))
        .orderBy(asc(datasets.name));

      return rows.map(toDatasetRecordWithSlug);
    },
    async findByTenantAndId(tenantId: string, datasetId: string) {
      const [dataset] = await db
        .select(datasetSelection())
        .from(datasets)
        .innerJoin(tenants, eq(datasets.tenantId, tenants.id))
        .where(and(eq(datasets.id, datasetId), eq(tenants.slug, tenantId)))
        .limit(1);

      return dataset ? toDatasetRecordWithSlug(dataset) : null;
    },
    async findPreviewByTenantAndId(tenantId: string, datasetId: string) {
      const [dataset] = await db
        .select({
          id: datasets.id,
          preview: datasets.preview
        })
        .from(datasets)
        .innerJoin(tenants, eq(datasets.tenantId, tenants.id))
        .where(and(eq(datasets.id, datasetId), eq(tenants.slug, tenantId)))
        .limit(1);

      return dataset ? normalizeDatasetPreview(dataset.preview) : null;
    },
    async updatePreview(input: {
      tenantId: string;
      datasetId: string;
      preview: DatasetPreview | null;
    }) {
      const datasetId = await findDatasetIdByTenant(db, input);

      if (!datasetId) {
        return null;
      }

      await db
        .update(datasets)
        .set({ preview: input.preview })
        .where(eq(datasets.id, datasetId));

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
      const datasetId = await findDatasetIdByTenant(db, input);

      if (!datasetId) {
        return null;
      }

      const [updated] = await db
        .update(datasets)
        .set({
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          storageBucket: input.storageBucket,
          storageObjectKey: input.storageObjectKey,
          storageUploadId: input.storageUploadId,
          status: input.status,
          importStatus: input.importStatus
        })
        .where(eq(datasets.id, datasetId))
        .returning();
      const tenant = await resolveTenantBySlug(db, input.tenantId);

      return toDatasetRecord({ ...updated, tenant: { slug: tenant.slug } });
    },
    async markProcessing(input: {
      tenantId: string;
      datasetId: string;
    }) {
      const datasetId = await findDatasetIdByTenant(db, input);

      if (!datasetId) {
        return null;
      }

      const [updated] = await db
        .update(datasets)
        .set({
          status: "processing",
          importStatus: "processing"
        })
        .where(eq(datasets.id, datasetId))
        .returning();
      const tenant = await resolveTenantBySlug(db, input.tenantId);

      return toDatasetRecord({ ...updated, tenant: { slug: tenant.slug } });
    },
    async markReady(input: {
      tenantId: string;
      datasetId: string;
      preview: DatasetPreview | null;
    }) {
      const datasetId = await findDatasetIdByTenant(db, input);

      if (!datasetId) {
        return null;
      }

      const [updated] = await db
        .update(datasets)
        .set({
          status: "ready",
          importStatus: "ready",
          warnings: [],
          preview: input.preview
        })
        .where(eq(datasets.id, datasetId))
        .returning();
      const tenant = await resolveTenantBySlug(db, input.tenantId);

      return toDatasetRecord({ ...updated, tenant: { slug: tenant.slug } });
    },
    async markFailed(input: {
      tenantId: string;
      datasetId: string;
      warnings: WarningRecord[];
    }) {
      const datasetId = await findDatasetIdByTenant(db, input);

      if (!datasetId) {
        return null;
      }

      const [updated] = await db
        .update(datasets)
        .set({
          status: "failed",
          importStatus: "failed",
          warnings: input.warnings
        })
        .where(eq(datasets.id, datasetId))
        .returning();
      const tenant = await resolveTenantBySlug(db, input.tenantId);

      return toDatasetRecord({ ...updated, tenant: { slug: tenant.slug } });
    },
    async findUsageByTenantAndId(tenantId: string, datasetId: string) {
      const existingDatasetId = await findDatasetIdByTenant(db, { tenantId, datasetId });

      if (!existingDatasetId) {
        return null;
      }

      const widgets = await db
        .select({
          id: dashboardWidgets.id,
          type: dashboardWidgets.type,
          dashboardId: dashboardWidgets.dashboardId,
          dashboardName: dashboards.name,
          dashboardWorkbookId: dashboards.workbookId
        })
        .from(dashboardWidgets)
        .innerJoin(dashboards, eq(dashboardWidgets.dashboardId, dashboards.id))
        .innerJoin(tenants, eq(dashboards.tenantId, tenants.id))
        .where(and(eq(dashboardWidgets.datasetId, datasetId), eq(tenants.slug, tenantId)))
        .orderBy(asc(dashboardWidgets.id));

      const dashboardUsage = Array.from(
        new Map(
          widgets.map((widget) => [
            widget.dashboardId,
            {
              id: widget.dashboardId,
              name: widget.dashboardName
            }
          ])
        ).values()
      );

      const workbookIds = Array.from(
        new Set(
          widgets
            .map((widget) => widget.dashboardWorkbookId)
            .filter((workbookId): workbookId is string => Boolean(workbookId))
        )
      );
      const workbookUsage = workbookIds.length
        ? await db
            .select({
              id: workbooks.id,
              name: workbooks.name
            })
            .from(workbooks)
            .innerJoin(tenants, eq(workbooks.tenantId, tenants.id))
            .where(and(inArray(workbooks.id, workbookIds), eq(tenants.slug, tenantId)))
            .orderBy(asc(workbooks.id))
        : [];

      return {
        dashboards: dashboardUsage,
        widgets: widgets.map((widget) => ({
          id: widget.id,
          dashboardId: widget.dashboardId,
          dashboardName: widget.dashboardName,
          type: widget.type
        })),
        workbooks: workbookUsage
      };
    }
  };
}
