export function mapDatasetDetail(input: {
  id: string;
  name: string;
  status: string;
  warnings: Array<{ code: string; message?: string }>;
}) {
  return {
    id: input.id,
    name: input.name,
    status: input.status,
    warnings: input.warnings
  };
}
