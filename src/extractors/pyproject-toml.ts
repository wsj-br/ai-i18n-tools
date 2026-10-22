/**
 * Limited `pyproject.toml` description reader.
 *
 * Supports single-line basic strings and triple-quoted strings for
 * `[project].description` and `[tool.poetry].description`. Other shapes
 * (arrays, inline tables, unknown multiline forms) return `unsupported`
 * so callers can warn instead of storing a wrong description.
 */

export interface PyprojectDescription {
  description: string;
  line: number;
  table: "project" | "poetry";
}

export type PyprojectDescriptionResult =
  | { ok: true; value: PyprojectDescription }
  | { ok: false; reason: "unsupported"; line: number }
  | { ok: false; reason: "missing" };

export function readPyprojectDescription(content: string): PyprojectDescriptionResult {
  const lines = content.split(/\r?\n/);
  let table: "project" | "poetry" | null = null;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const trimmed = stripTomlComment(raw).trim();
    const header = trimmed.match(/^\[([^\]]+)\]$/);
    if (header) {
      const name = header[1]!.trim();
      if (name === "project") {
        table = "project";
      } else if (name === "tool.poetry") {
        table = "poetry";
      } else {
        table = null;
      }
      continue;
    }
    if (!table || !trimmed.startsWith("description")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq < 0 || trimmed.slice(0, eq).trim() !== "description") {
      continue;
    }
    const rhs = trimmed.slice(eq + 1).trim();
    const parsed = parseTomlString(rhs, lines, i);
    if (parsed.kind === "unsupported") {
      return { ok: false, reason: "unsupported", line: i + 1 };
    }
    if (parsed.kind === "string") {
      return {
        ok: true,
        value: { description: parsed.value.trim(), line: i + 1, table },
      };
    }
  }
  return { ok: false, reason: "missing" };
}

function stripTomlComment(line: string): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quote) {
      if (ch === "\\" && quote.length === 1) {
        i++;
        continue;
      }
      if (line.startsWith(quote, i)) {
        i += quote.length - 1;
        quote = null;
      }
      continue;
    }
    if (line.startsWith('"""', i) || line.startsWith("'''", i)) {
      quote = line.slice(i, i + 3);
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "#") {
      return line.slice(0, i);
    }
  }
  return line;
}

function parseTomlString(
  rhs: string,
  lines: string[],
  lineIndex: number
): { kind: "string"; value: string } | { kind: "unsupported" } | { kind: "skip" } {
  if (rhs.startsWith('"""') || rhs.startsWith("'''")) {
    const quote = rhs.slice(0, 3);
    const rest = rhs.slice(3);
    const sameLine = rest.indexOf(quote);
    if (sameLine !== -1) {
      return { kind: "string", value: decodeBasic(rest.slice(0, sameLine)) };
    }
    const chunks = [rest];
    for (let j = lineIndex + 1; j < lines.length; j++) {
      const line = lines[j] ?? "";
      const close = line.indexOf(quote);
      if (close === -1) {
        chunks.push(line);
        continue;
      }
      chunks.push(line.slice(0, close));
      return { kind: "string", value: decodeBasic(chunks.join("\n")) };
    }
    return { kind: "unsupported" };
  }
  if (rhs.startsWith('"') || rhs.startsWith("'")) {
    const quote = rhs[0]!;
    let value = "";
    for (let i = 1; i < rhs.length; i++) {
      const ch = rhs[i]!;
      if (ch === "\\" && quote === '"' && i + 1 < rhs.length) {
        value += decodeEscape(rhs[i + 1]!);
        i++;
        continue;
      }
      if (ch === quote) {
        return { kind: "string", value };
      }
      value += ch;
    }
    return { kind: "unsupported" };
  }
  return { kind: "unsupported" };
}

function decodeBasic(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function decodeEscape(ch: string): string {
  if (ch === "n") {
    return "\n";
  }
  if (ch === "t") {
    return "\t";
  }
  if (ch === '"') {
    return '"';
  }
  if (ch === "\\") {
    return "\\";
  }
  return ch;
}
