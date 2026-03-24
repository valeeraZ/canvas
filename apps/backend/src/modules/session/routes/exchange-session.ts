import type { AuthorizationContext } from "../../../../../../packages/auth/src/authorization-api.js";
import type { AuthorizationResolver } from "../../../../../../packages/auth/src/cached-authorization-resolver.js";
import { createMembershipStore } from "../../../../../../packages/db/src/membership-store.js";
import { createPrincipalStore } from "../../../../../../packages/db/src/principal-store.js";
import { createTenantStore } from "../../../../../../packages/db/src/tenant-store.js";
import type { PrismaClient } from "../../../../../../packages/db/src/generated/prisma/client.js";
import type { SessionExchangeResult } from "../../../../../../packages/contracts/src/session.js";

export async function exchangeHostAssertion(input: {
  authBaseUrl: string;
  token: string;
  appName: string;
  mockContext?: AuthorizationContext;
  authorizationResolver: AuthorizationResolver;
  db?: PrismaClient;
}): Promise<SessionExchangeResult> {
  const assertion = await input.authorizationResolver.resolve({
    amtoken: input.token,
    appName: input.appName,
    authBaseUrl: input.authBaseUrl,
    mockContext: input.mockContext
  });

  if (input.db) {
    const tenantStore = createTenantStore(input.db);
    const principalStore = createPrincipalStore(input.db);
    const membershipStore = createMembershipStore(input.db);

    const tenant = await tenantStore.upsert({
      slug: assertion.appName,
      name: assertion.appName
    });
    const principal = await principalStore.upsert({
      externalUserId: assertion.employeeId
    });

    for (const role of assertion.roles) {
      await membershipStore.upsert({
        tenantId: tenant.id as string,
        principalId: principal.id as string,
        role
      });
    }
  }

  return {
    expiresIn: 1800,
    selectedApp: assertion.appName,
    principal: {
      employeeId: assertion.employeeId,
      displayName: assertion.displayName,
      roles: assertion.roles
    }
  };
}
