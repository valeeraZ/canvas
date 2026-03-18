export type TenantContext = {
  tenantId: string;
  roles: string[];
};

export function assertTenantContext(value: TenantContext | undefined): TenantContext {
  if (!value?.tenantId) {
    throw new Error("Missing tenant context");
  }

  return value;
}
