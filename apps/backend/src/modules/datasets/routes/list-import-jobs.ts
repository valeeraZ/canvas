export function mapImportJobSummary(input: {
  id: string;
  status: string;
  warnings: Array<{ code: string }>;
}) {
  return {
    id: input.id,
    status: input.status,
    warningCount: input.warnings.length
  };
}
