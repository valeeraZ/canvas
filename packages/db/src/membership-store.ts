import { asc, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { memberships } from "./schema.js";

export type MembershipRecord = {
  id: string;
  tenantId: string;
  principalId: string;
  role: string;
};

export function toMembershipRecord(input: MembershipRecord): MembershipRecord {
  return {
    id: input.id,
    tenantId: input.tenantId,
    principalId: input.principalId,
    role: input.role
  };
}

export function createMembershipStore(db: DbClient) {
  return {
    async upsert(input: {
      tenantId: string;
      principalId: string;
      role: string;
    }) {
      const [membership] = await db
        .insert(memberships)
        .values({
          tenantId: input.tenantId,
          principalId: input.principalId,
          role: input.role
        })
        .onConflictDoUpdate({
          target: [memberships.tenantId, memberships.principalId],
          set: {
            role: input.role
          }
        })
        .returning();

      return toMembershipRecord(membership);
    },
    async listByTenant(tenantId: string) {
      const rows = await db
        .select()
        .from(memberships)
        .where(eq(memberships.tenantId, tenantId))
        .orderBy(asc(memberships.principalId));

      return rows.map(toMembershipRecord);
    }
  };
}
