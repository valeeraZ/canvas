export function parseCsv(content: string) {
  const lines = content.trim().split(/\r?\n/);
  const [headerLine = "", ...rowLines] = lines;
  const headers = headerLine.split(",").map((value) => value.trim());
  const rows = rowLines.map((line) => line.split(",").map((value) => value.trim()));

  return { headers, rows };
}
