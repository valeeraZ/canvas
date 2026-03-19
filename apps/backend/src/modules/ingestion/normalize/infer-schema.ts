export function inferSchema(input: { headers: string[]; rows: Array<Array<string | null>> }) {
  return input.headers.map((name) => ({ name, type: "string" as const }));
}
