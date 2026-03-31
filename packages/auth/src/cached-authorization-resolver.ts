import { createHash } from "node:crypto";
import type {
  AccessibleApp,
  AuthorizationContext,
  AuthorizationApiInput,
  AuthorizationPrincipal
} from "./authorization-api.js";
import {
  fetchAccessibleApps,
  fetchAuthorizationContext,
  fetchCurrentPrincipal
} from "./authorization-api.js";
import type { ExpiringStore } from "./expiring-store.js";

export type ResolvedAuthorizationContext = {
  appName: string;
  displayName: string;
  employeeId: string;
  roles: string[];
  groups: string[];
};

export type AuthorizationResolver = {
  getPrincipal?(input: {
    amtoken: string;
    authBaseUrl?: string;
    fetchImpl?: typeof fetch;
    mockContext?: AuthorizationContext;
  }): Promise<AuthorizationPrincipal>;
  listAccessibleApps?(input: {
    amtoken: string;
    authBaseUrl?: string;
    fetchImpl?: typeof fetch;
    mockContext?: AuthorizationContext;
    mockAccessibleApps?: AccessibleApp[];
  }): Promise<AccessibleApp[]>;
  resolve(input: {
    amtoken: string;
    appName: string;
    authBaseUrl?: string;
    fetchImpl?: typeof fetch;
    mockContext?: AuthorizationContext;
    mockAccessibleApps?: AccessibleApp[];
  }): Promise<ResolvedAuthorizationContext>;
};

export type CreateCachedAuthorizationResolverInput = {
  authBaseUrl: string;
  ttlSeconds?: number;
  cache: ExpiringStore;
  defaultMockContext?: AuthorizationContext;
  defaultMockAccessibleApps?: AccessibleApp[];
  fetchAuthorizationContextImpl?: (
    input: AuthorizationApiInput
  ) => Promise<AuthorizationContext>;
  fetchCurrentPrincipalImpl?: (input: {
    authBaseUrl: string;
    token: string;
    fetchImpl?: typeof fetch;
    mockContext?: AuthorizationContext;
  }) => Promise<AuthorizationPrincipal>;
  fetchAccessibleAppsImpl?: (input: {
    authBaseUrl: string;
    token: string;
    fetchImpl?: typeof fetch;
    mockContext?: AuthorizationContext;
    mockAccessibleApps?: AccessibleApp[];
  }) => Promise<AccessibleApp[]>;
};

function createCacheKey(amtoken: string, appName: string) {
  const digest = createHash("sha256").update(amtoken).digest("hex");
  return `canvas:authz:${digest}:${appName}`;
}

function createPrincipalCacheKey(amtoken: string) {
  const digest = createHash("sha256").update(amtoken).digest("hex");
  return `canvas:authz-principal:${digest}`;
}

function createAppsCacheKey(amtoken: string) {
  const digest = createHash("sha256").update(amtoken).digest("hex");
  return `canvas:authz-apps:${digest}`;
}

export function createCachedAuthorizationResolver(
  input: CreateCachedAuthorizationResolverInput
): AuthorizationResolver {
  const ttlSeconds = input.ttlSeconds ?? 1800;
  const loadAuthorizationContext =
    input.fetchAuthorizationContextImpl ?? fetchAuthorizationContext;
  const loadPrincipal = input.fetchCurrentPrincipalImpl ?? fetchCurrentPrincipal;
  const loadAccessibleApps = input.fetchAccessibleAppsImpl ?? fetchAccessibleApps;

  return {
    async getPrincipal(request) {
      const authBaseUrl = request.authBaseUrl ?? input.authBaseUrl;
      const cacheKey = createPrincipalCacheKey(request.amtoken);
      const cached = await input.cache.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as AuthorizationPrincipal;
      }

      const principal = await loadPrincipal({
        authBaseUrl,
        token: request.amtoken,
        fetchImpl: request.fetchImpl,
        mockContext: request.mockContext ?? input.defaultMockContext
      });

      await input.cache.set(cacheKey, JSON.stringify(principal), ttlSeconds);
      return principal;
    },
    async listAccessibleApps(request) {
      const authBaseUrl = request.authBaseUrl ?? input.authBaseUrl;
      const cacheKey = createAppsCacheKey(request.amtoken);
      const cached = await input.cache.get(cacheKey);

      if (cached) {
        return JSON.parse(cached) as AccessibleApp[];
      }

      const apps = await loadAccessibleApps({
        authBaseUrl,
        token: request.amtoken,
        fetchImpl: request.fetchImpl,
        mockContext: request.mockContext ?? input.defaultMockContext,
        mockAccessibleApps:
          request.mockAccessibleApps ?? input.defaultMockAccessibleApps
      });

      await input.cache.set(cacheKey, JSON.stringify(apps), ttlSeconds);
      return apps;
    },
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
        mockContext: request.mockContext ?? input.defaultMockContext,
        mockAccessibleApps:
          request.mockAccessibleApps ?? input.defaultMockAccessibleApps
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
