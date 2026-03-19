export function buildDashboardRecord(input: {
  tenantId: string;
  name: string;
  workbookId?: string;
}) {
  return {
    tenantId: input.tenantId,
    name: input.name,
    workbookId: input.workbookId ?? null
  };
}
