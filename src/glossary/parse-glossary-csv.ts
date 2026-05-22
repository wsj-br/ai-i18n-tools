import path from "path";
import { parse } from "csv-parse/sync";

const GLOSSARY_CSV_PARSE_OPTIONS = {
  columns: true,
  skip_empty_lines: true,
  trim: true,
} as const;

/**
 * Parse glossary CSV with file context on `csv-parse` failures (e.g. `glossary-user.csv: …`).
 */
export function parseGlossaryCsv(filepath: string, content: string): Record<string, string>[] {
  try {
    return parse(content, GLOSSARY_CSV_PARSE_OPTIONS) as Record<string, string>[];
  } catch (e) {
    const label = path.basename(filepath);
    const detail = e instanceof Error ? e.message : String(e);
    throw new Error(`${label}: ${detail}`);
  }
}
