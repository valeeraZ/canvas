import type { TenantContext } from "./tenant-context.js";

export function decodeCanvasAccessToken(token: string): {
  tenantId: string;
  externalUserId: string;
  roles: string[];
} {
  const [prefix, tenantId, externalUserId, roles] = token.split(".");

  if (prefix !== "canvas" || !tenantId || !externalUserId) {
    throw new Error("Invalid canvas access token");
  }

  return {
    tenantId,
    externalUserId,
    roles: roles ? roles.split(",").filter(Boolean) : []
  };
}

export function buildTenantContextFromToken(token: string): TenantContext {
  const claims = decodeCanvasAccessToken(token);

  return {
    tenantId: claims.tenantId,
    roles: claims.roles
  };
}
