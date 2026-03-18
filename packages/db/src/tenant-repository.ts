export type TenantRecord = {
  id?: string;
  slug: string;
  name: string;
};

export function buildTenantRecord(input: TenantRecord): TenantRecord {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name
  };
}
