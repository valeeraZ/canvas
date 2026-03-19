export function mapDatasetSummary(input: {
  id: string;
  name: string;
  status: string;
  warnings: Array<{ code: string }>;
}) {
  return {
    id: input.id,
    name: input.name,
    status: input.status,
    warningCount: input.warnings.length
  };
}
