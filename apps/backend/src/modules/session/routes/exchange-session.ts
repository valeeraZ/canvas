import { buildHostAssertion } from "../../../../../../packages/auth/src/host-assertion";
import type { AuthorizationContext } from "../../../../../../packages/auth/src/authorization-api";
import { mintCanvasAccessToken } from "../../../../../../packages/auth/src/canvas-token";
import {
  createMembershipStore,
  createPrincipalStore,
  createTenantStore
} from "../../../../../../packages/db/src";
import type { PrismaClient } from "../../../../../../packages/db/src/generated/prisma/client";
import type { SessionExchangeResult } from "../../../../../../packages/contracts/src/session";

export async function exchangeHostAssertion(input: {
  authBaseUrl: string;
  token: string;
  appName: string;
  fetchImpl?: typeof fetch;
  mockContext?: AuthorizationContext;
  db?: PrismaClient;
}): Promise<SessionExchangeResult> {
  const assertion = await buildHostAssertion(input);

  if (input.db) {
    const tenantStore = createTenantStore(input.db);
    const principalStore = createPrincipalStore(input.db);
    const membershipStore = createMembershipStore(input.db);

    const tenant = await tenantStore.upsert({
      slug: assertion.tenantId,
      name: assertion.tenantId
    });
    const principal = await principalStore.upsert({
      externalUserId: assertion.externalUserId
    });

    for (const role of assertion.roles) {
      await membershipStore.upsert({
        tenantId: tenant.id as string,
        principalId: principal.id as string,
        role
      });
    }
  }

  const accessToken = mintCanvasAccessToken({
    tenantId: assertion.tenantId,
    externalUserId: assertion.externalUserId,
    roles: assertion.roles
  });

  return {
    accessToken,
    expiresIn: 900,
    principal: {
      employeeId: assertion.externalUserId,
      displayName: assertion.displayName,
      roles: assertion.roles
    }
  };
}
