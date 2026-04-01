import type { DatasetRecord } from "../../../packages/contracts/src/datasets.js";
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
    warnings: normalizeWarnings(input.warnings)
  };
}

export function createDatasetStore(prisma: PrismaClient) {
  return {
    async create(input: { tenantId: string; name: string; status?: string }) {
      const tenant = await resolveTenantBySlug(prisma, input.tenantId);
      const dataset = await prisma.dataset.create({
        data: {
          tenantId: tenant.id,
          name: input.name,
          status: input.status ?? "queued",
          warnings: []
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
    }
  };
}
