import { createHash } from "node:crypto";
import type { AuthorizationContext, AuthorizationApiInput } from "./authorization-api.js";
import { fetchAuthorizationContext } from "./authorization-api.js";
import type { ExpiringStore } from "./expiring-store.js";

export type ResolvedAuthorizationContext = {
  appName: string;
  displayName: string;
  employeeId: string;
  roles: string[];
  groups: string[];
};

export type AuthorizationResolver = {
  resolve(input: {
    amtoken: string;
    appName: string;
    authBaseUrl?: string;
    fetchImpl?: typeof fetch;
    mockContext?: AuthorizationContext;
  }): Promise<ResolvedAuthorizationContext>;
};

export type CreateCachedAuthorizationResolverInput = {
  authBaseUrl: string;
  ttlSeconds?: number;
  cache: ExpiringStore;
  defaultMockContext?: AuthorizationContext;
  fetchAuthorizationContextImpl?: (
    input: AuthorizationApiInput
  ) => Promise<AuthorizationContext>;
};

function createCacheKey(amtoken: string, appName: string) {
  const digest = createHash("sha256").update(amtoken).digest("hex");
  return `canvas:authz:${digest}:${appName}`;
}

export function createCachedAuthorizationResolver(
  input: CreateCachedAuthorizationResolverInput
): AuthorizationResolver {
  const ttlSeconds = input.ttlSeconds ?? 1800;
  const loadAuthorizationContext =
    input.fetchAuthorizationContextImpl ?? fetchAuthorizationContext;

  return {
    async resolve(request) {
      const appName = request.appName.trim();
      const authBaseUrl = request.authBaseUrl ?? input.authBaseUrl;
      const cacheKey = createCacheKey(request.amtoken, appName);
      const cached = await input.cache.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as ResolvedAuthorizationContext;
      }

      const context = await loadAuthorizationContext({
        authBaseUrl,
        token: request.amtoken,
        appName,
        fetchImpl: request.fetchImpl,
        mockContext: request.mockContext ?? input.defaultMockContext
      });

      const resolved: ResolvedAuthorizationContext = {
        appName,
        displayName: context.displayName,
        employeeId: context.employeeId,
        roles: context.roles,
        groups: []
      };

      await input.cache.set(cacheKey, JSON.stringify(resolved), ttlSeconds);
      return resolved;
    }
  };
}
