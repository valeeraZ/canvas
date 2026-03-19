export function buildDatasetRecord(input: { tenantId: string; name: string }) {
  return {
    tenantId: input.tenantId,
    name: input.name,
    status: "queued" as const
  };
}
