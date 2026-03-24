import type { ImportJobRecord } from "../../../packages/contracts/src/datasets.js";
import type { PrismaClient } from "./generated/prisma/client.js";

type WarningRecord = {
  code: string;
  message?: string;
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

export function toImportJobRecord(input: {
  id: string;
  datasetId: string;
  tenantId: string;
  status: string;
  objectKey: string;
  warnings: unknown;
}): ImportJobRecord {
  return {
    id: input.id,
    datasetId: input.datasetId,
    tenantId: input.tenantId,
    status: input.status as ImportJobRecord["status"],
    objectKey: input.objectKey,
    warnings: normalizeWarnings(input.warnings)
  };
}

export function createImportJobStore(prisma: PrismaClient) {
  return {
    async create(input: {
      datasetId: string;
      tenantId: string;
      objectKey: string;
      status?: string;
    }) {
      const job = await prisma.importJob.create({
        data: {
          datasetId: input.datasetId,
          tenantId: input.tenantId,
          objectKey: input.objectKey,
          status: input.status ?? "queued",
          warnings: []
        }
      });

      return toImportJobRecord(job);
    }
  };
}
