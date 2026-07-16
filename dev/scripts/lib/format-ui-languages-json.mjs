/** One JSON object per line (valid JSON array); keeps the file grep-friendly. */
export function formatUiLanguagesJson(rows) {
  if (rows.length === 0) return "[]\n";
  const lines = rows.map((r) => `  ${JSON.stringify(r)}`);
  return `[\n${lines.join(",\n")}\n]\n`;
}
