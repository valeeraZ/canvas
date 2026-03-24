import { createCachedAuthorizationResolver } from "../../../../../packages/auth/src/cached-authorization-resolver.js";
import { createMemoryExpiringStore } from "../../../../../packages/auth/src/memory-expiring-store.js";
import { exchangeHostAssertion } from "../../../../../apps/backend/src/modules/session/routes/exchange-session.js";

const defaultMockContext = {
  displayName: "Local Dev",
  employeeId: "dev-1",
  roles: ["ADMIN"]
} as const;

export async function resolvePortalSession(input: {
  token?: string;
  appName: string;
  mockContext?: {
    displayName?: string;
    employeeId?: string;
    roles?: string[];
  };
}) {
  return exchangeHostAssertion({
    authBaseUrl: process.env.AUTH_BASE_URL ?? "http://auth.local",
    token: input.token ?? "local-dev-token",
    appName: input.appName,
    authorizationResolver: createCachedAuthorizationResolver({
      authBaseUrl: process.env.AUTH_BASE_URL ?? "http://auth.local",
      defaultMockContext: {
        displayName:
          input.mockContext?.displayName ?? defaultMockContext.displayName,
        employeeId: input.mockContext?.employeeId ?? defaultMockContext.employeeId,
        roles: input.mockContext?.roles ?? [...defaultMockContext.roles]
      },
      cache: createMemoryExpiringStore()
    }),
    mockContext: {
      displayName: input.mockContext?.displayName ?? defaultMockContext.displayName,
      employeeId: input.mockContext?.employeeId ?? defaultMockContext.employeeId,
      roles: input.mockContext?.roles ?? [...defaultMockContext.roles]
    }
  });
}
