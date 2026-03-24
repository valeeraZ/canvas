import type { PrismaClient } from "./generated/prisma/client.js";

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

export function createMembershipStore(prisma: PrismaClient) {
  return {
    async upsert(input: {
      tenantId: string;
      principalId: string;
      role: string;
    }) {
      const membership = await prisma.membership.upsert({
        where: {
          tenantId_principalId: {
            tenantId: input.tenantId,
            principalId: input.principalId
          }
        },
        update: {
          role: input.role
        },
        create: {
          tenantId: input.tenantId,
          principalId: input.principalId,
          role: input.role
        }
      });

      return toMembershipRecord(membership);
    },
    async listByTenant(tenantId: string) {
      const memberships = await prisma.membership.findMany({
        where: {
          tenantId
        },
        orderBy: {
          principalId: "asc"
        }
      });

      return memberships.map(toMembershipRecord);
    }
  };
}
