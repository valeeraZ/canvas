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
    },
    async findById(input: {
      tenantId: string;
      importJobId: string;
    }) {
      const job = await prisma.importJob.findFirst({
        where: {
          id: input.importJobId,
          tenantId: input.tenantId
        }
      });

      return job ? toImportJobRecord(job) : null;
    },
    async listQueuedJobs() {
      const jobs = await prisma.importJob.findMany({
        where: {
          status: "queued"
        },
        orderBy: {
          id: "asc"
        }
      });

      return jobs.map(toImportJobRecord);
    },
    async updateStatus(input: {
      importJobId: string;
      status: ImportJobRecord["status"];
    }) {
      const job = await prisma.importJob.update({
        where: {
          id: input.importJobId
        },
        data: {
          status: input.status
        }
      });

      return toImportJobRecord(job);
    },
    async claimNext(input: {
      importJobId: string;
      claimedAt: Date;
    }) {
      const result = await prisma.importJob.updateMany({
        where: {
          id: input.importJobId,
          status: "queued"
        },
        data: {
          status: "processing",
          claimedAt: input.claimedAt
        }
      } as never);

      if (result.count === 0) {
        return null;
      }

      const job = await prisma.importJob.findUnique({
        where: {
          id: input.importJobId
        }
      } as never);

      return job ? toImportJobRecord(job) : null;
    },
    async markReady(input: {
      importJobId: string;
      completedAt: Date;
    }) {
      const job = await prisma.importJob.update({
        where: {
          id: input.importJobId
        },
        data: {
          status: "ready",
          warnings: [],
          completedAt: input.completedAt
        }
      } as never);

      return toImportJobRecord(job);
    },
    async markFailed(input: {
      importJobId: string;
      completedAt: Date;
      warnings: WarningRecord[];
    }) {
      const job = await prisma.importJob.update({
        where: {
          id: input.importJobId
        },
        data: {
          status: "failed",
          warnings: input.warnings,
          completedAt: input.completedAt
        }
      } as never);

      return toImportJobRecord(job);
    },
    async listStaleProcessingJobs(input: {
      staleBefore: Date;
    }) {
      const jobs = await prisma.importJob.findMany({
        where: {
          status: "processing",
          claimedAt: {
            lt: input.staleBefore
          }
        },
        orderBy: {
          claimedAt: "asc"
        }
      } as never);

      return jobs.map(toImportJobRecord);
    },
    async resetStaleProcessingJobs(input: {
      staleBefore: Date;
    }) {
      const result = await prisma.importJob.updateMany({
        where: {
          status: "processing",
          claimedAt: {
            lt: input.staleBefore
          }
        },
        data: {
          status: "queued",
          claimedAt: null
        }
      } as never);

      return result.count;
    }
  };
}
