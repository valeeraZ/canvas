export function buildWorkbookRecord(input: { tenantId: string; name: string }) {
  return {
    tenantId: input.tenantId,
    name: input.name
  };
}
