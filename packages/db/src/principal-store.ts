import type { PrincipalRecord } from "./principal-repository.js";
import { eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { principals } from "./schema.js";

type PersistedPrincipal = {
  id: string;
  externalUserId: string;
};

export function toPrincipalRecord(input: PersistedPrincipal): PrincipalRecord {
  return {
    id: input.id,
    externalUserId: input.externalUserId
  };
}

export function createPrincipalStore(db: DbClient) {
  return {
    async upsert(input: { externalUserId: string }) {
      const [principal] = await db
        .insert(principals)
        .values({
          externalUserId: input.externalUserId
        })
        .onConflictDoUpdate({
          target: principals.externalUserId,
          set: {
            externalUserId: input.externalUserId
          }
        })
        .returning();

      return toPrincipalRecord(principal);
    },
    async findByExternalUserId(externalUserId: string) {
      const [principal] = await db
        .select()
        .from(principals)
        .where(eq(principals.externalUserId, externalUserId))
        .limit(1);

      return principal ? toPrincipalRecord(principal) : null;
    }
  };
}
