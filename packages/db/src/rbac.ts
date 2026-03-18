const permissions = {
  tenant_admin: ["branding:update", "dataset:write", "dashboard:publish"],
  analyst: ["dataset:read", "dataset:write", "dashboard:publish"],
  viewer: ["dataset:read", "dashboard:read"]
} as const;

export type TenantRole = keyof typeof permissions;

export function can(role: TenantRole, action: string): boolean {
  return permissions[role].includes(action as never);
}
