import { assertTenantContext, type TenantContext } from "./tenant-context";

export function requireSocketTenantContext(value: TenantContext | undefined): TenantContext {
  return assertTenantContext(value);
}
