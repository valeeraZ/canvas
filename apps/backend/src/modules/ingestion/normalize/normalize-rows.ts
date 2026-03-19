export function normalizeRows(input: { headers: string[]; rows: string[][] }) {
  return {
    headers: input.headers.map((value) =>
      value.trim().toLowerCase().replaceAll(" ", "_")
    ),
    rows: input.rows.map((row) => row.map((value) => (value === "" ? null : value)))
  };
}
