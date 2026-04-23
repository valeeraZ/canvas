import type { ImportJobRecord } from "../../../packages/contracts/src/datasets.js";
import { and, asc, eq, lt } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { importJobs } from "./schema.js";

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

export function createImportJobStore(db: DbClient) {
  return {
    async create(input: {
      datasetId: string;
      tenantId: string;
      objectKey: string;
      status?: string;
    }) {
      const [job] = await db
        .insert(importJobs)
        .values({
          datasetId: input.datasetId,
          tenantId: input.tenantId,
          objectKey: input.objectKey,
          status: input.status ?? "queued",
          warnings: []
        })
        .returning();

      return toImportJobRecord(job);
    },
    async findById(input: {
      tenantId: string;
      importJobId: string;
    }) {
      const [job] = await db
        .select()
        .from(importJobs)
        .where(
          and(
            eq(importJobs.id, input.importJobId),
            eq(importJobs.tenantId, input.tenantId)
          )
        )
        .limit(1);

      return job ? toImportJobRecord(job) : null;
    },
    async listQueuedJobs() {
      const jobs = await db
        .select()
        .from(importJobs)
        .where(eq(importJobs.status, "queued"))
        .orderBy(asc(importJobs.id));

      return jobs.map(toImportJobRecord);
    },
    async updateStatus(input: {
      importJobId: string;
      status: ImportJobRecord["status"];
    }) {
      const [job] = await db
        .update(importJobs)
        .set({ status: input.status })
        .where(eq(importJobs.id, input.importJobId))
        .returning();

      return toImportJobRecord(job);
    },
    async claimNext(input: {
      importJobId: string;
      claimedAt: Date;
    }) {
      const [job] = await db
        .update(importJobs)
        .set({
          status: "processing",
          claimedAt: input.claimedAt
        })
        .where(and(eq(importJobs.id, input.importJobId), eq(importJobs.status, "queued")))
        .returning();

      return job ? toImportJobRecord(job) : null;
    },
    async markReady(input: {
      importJobId: string;
      completedAt: Date;
    }) {
      const [job] = await db
        .update(importJobs)
        .set({
          status: "ready",
          warnings: [],
          completedAt: input.completedAt
        })
        .where(eq(importJobs.id, input.importJobId))
        .returning();

      return toImportJobRecord(job);
    },
    async markFailed(input: {
      importJobId: string;
      completedAt: Date;
      warnings: WarningRecord[];
    }) {
      const [job] = await db
        .update(importJobs)
        .set({
          status: "failed",
          warnings: input.warnings,
          completedAt: input.completedAt
        })
        .where(eq(importJobs.id, input.importJobId))
        .returning();

      return toImportJobRecord(job);
    },
    async listStaleProcessingJobs(input: {
      staleBefore: Date;
    }) {
      const jobs = await db
        .select()
        .from(importJobs)
        .where(
          and(
            eq(importJobs.status, "processing"),
            lt(importJobs.claimedAt, input.staleBefore)
          )
        )
        .orderBy(asc(importJobs.claimedAt));

      return jobs.map(toImportJobRecord);
    },
    async resetStaleProcessingJobs(input: {
      staleBefore: Date;
    }) {
      const rows = await db
        .update(importJobs)
        .set({
          status: "queued",
          claimedAt: null
        })
        .where(
          and(
            eq(importJobs.status, "processing"),
            lt(importJobs.claimedAt, input.staleBefore)
          )
        )
        .returning({ id: importJobs.id });

      return rows.length;
    }
  };
}
