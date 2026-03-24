import type { PrincipalRecord } from "./principal-repository.js";
import type { PrismaClient } from "./generated/prisma/client.js";

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

export function createPrincipalStore(prisma: PrismaClient) {
  return {
    async upsert(input: { externalUserId: string }) {
      const principal = await prisma.principal.upsert({
        where: {
          externalUserId: input.externalUserId
        },
        update: {},
        create: {
          externalUserId: input.externalUserId
        }
      });

      return toPrincipalRecord(principal);
    },
    async findByExternalUserId(externalUserId: string) {
      const principal = await prisma.principal.findUnique({
        where: {
          externalUserId
        }
      });

      return principal ? toPrincipalRecord(principal) : null;
    }
  };
}
