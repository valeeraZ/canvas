import { assertTenantContext, type TenantContext } from "./tenant-context.js";

export function requireSocketTenantContext(value: TenantContext | undefined): TenantContext {
  return assertTenantContext(value);
}
