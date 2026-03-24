import { assertTenantContext, type TenantContext } from "./tenant-context.js";

export function requireHttpTenantContext(value: TenantContext | undefined): TenantContext {
  return assertTenantContext(value);
}

export function readBearerToken(headerValue: string | undefined): string {
  if (!headerValue?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  return headerValue.slice("Bearer ".length);
}
