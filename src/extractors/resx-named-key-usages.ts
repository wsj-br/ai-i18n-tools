/**
 * Suggestions for legacy resx names (`Resources.LoginButton`) that still appear in source.
 * The neutral file maps the name to the source string. Call sites are not edited.
 */
import { RESX_CONTEXT_SEPARATOR, type ResxDataEntry } from "../core/resx-codec.js";

export interface ResxNamedKeySuggestion {
  file: string;
  line: number;
  expression: string;
  source: string;
  replacement: string;
}

const PLURAL_SUFFIX = /\[(zero|one|two|few|many|other)\]$/;
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Names whose neutral value is the English source, not the name itself. */
export function legacyNamedResxKeys(entries: readonly ResxDataEntry[]): Map<string, string> {
  const keys = new Map<string, string>();
  for (const entry of entries) {
    if (entry.type || entry.mimetype) {
      continue;
    }
    const name = entry.name.trim();
    const value = entry.value.trim();
    if (!name || !value || !IDENT.test(name)) {
      continue;
    }
    if (name.includes(RESX_CONTEXT_SEPARATOR) || PLURAL_SUFFIX.test(name)) {
      continue;
    }
    if (name === value) {
      continue;
    }
    keys.set(name, value);
  }
  return keys;
}

export function findResxNamedKeyUsages(
  content: string,
  file: string,
  keys: ReadonlyMap<string, string>
): ResxNamedKeySuggestion[] {
  if (keys.size === 0) {
    return [];
  }
  const found: ResxNamedKeySuggestion[] = [];
  let i = 0;
  while (i < content.length) {
    const ch = content[i]!;
    if (ch === "/" && content[i + 1] === "/") {
      i = indexOfOrEnd(content, "\n", i + 2);
      continue;
    }
    if (ch === "/" && content[i + 1] === "*") {
      i = indexOfOrEnd(content, "*/", i + 2);
      continue;
    }
    if (content.startsWith("<!--", i)) {
      i = indexOfOrEnd(content, "-->", i + 4);
      continue;
    }
    if (ch === '"') {
      const literal = readString(content, i);
      const source = keys.get(literal.decoded);
      if (source) {
        found.push(
          suggestion(file, content, literal.start, literal.end, `"${literal.decoded}"`, source)
        );
      }
      i = literal.end;
      continue;
    }
    if (ch === "'" && looksLikeChar(content, i)) {
      i += 3;
      continue;
    }
    if (isIdentStart(ch)) {
      const start = i;
      i++;
      while (isIdentChar(content[i])) {
        i++;
      }
      const name = content.slice(start, i);
      const source = keys.get(name);
      if (!source) {
        continue;
      }
      const expression = dottedExpression(content, start, i);
      found.push(suggestion(file, content, start, i, expression, source));
      continue;
    }
    i++;
  }
  return found;
}

export function renderNamedKeySection(suggestions: readonly ResxNamedKeySuggestion[]): string {
  const lines = [
    NAMED_KEY_SECTION_START,
    "## Named resource keys",
    "",
    "Suggestions only. These call sites still use a resx name. The neutral file maps that name to the source string. Nothing in this section was edited.",
    "",
  ];
  const sorted = [...suggestions].sort(
    (a, b) =>
      a.file.localeCompare(b.file) || a.line - b.line || a.expression.localeCompare(b.expression)
  );
  for (const item of sorted) {
    lines.push(`- ${item.file}:${item.line} ${item.expression} → ${item.replacement}`);
  }
  if (sorted.length === 0) {
    lines.push("No named resx keys were found in source.");
  }
  lines.push("", NAMED_KEY_SECTION_END, "");
  return lines.join("\n");
}

export const NAMED_KEY_SECTION_START = "<!-- resx-named-keys: start -->";
export const NAMED_KEY_SECTION_END = "<!-- resx-named-keys: end -->";

export function upsertNamedKeySection(report: string, section: string): string {
  const start = report.indexOf(NAMED_KEY_SECTION_START);
  const end = report.indexOf(NAMED_KEY_SECTION_END);
  if (start !== -1 && end !== -1 && end > start) {
    const after = end + NAMED_KEY_SECTION_END.length;
    return `${report.slice(0, start)}${section.trim()}\n${report.slice(after).replace(/^\n/, "")}`;
  }
  const trimmed = report.trimEnd();
  return `${trimmed}\n\n${section.trim()}\n`;
}

function suggestion(
  file: string,
  content: string,
  identStart: number,
  _identEnd: number,
  expression: string,
  source: string
): ResxNamedKeySuggestion {
  return {
    file,
    line: lineAt(content, identStart),
    expression,
    source,
    replacement: `T(${csharpString(source)})`,
  };
}

function dottedExpression(content: string, identStart: number, identEnd: number): string {
  let start = identStart;
  while (start > 0) {
    let j = start - 1;
    while (j >= 0 && /\s/.test(content[j]!)) {
      j--;
    }
    if (content[j] !== ".") {
      break;
    }
    j--;
    while (j >= 0 && /\s/.test(content[j]!)) {
      j--;
    }
    let k = j;
    while (k >= 0 && isIdentChar(content[k])) {
      k--;
    }
    if (k === j || !isIdentStart(content[k + 1])) {
      break;
    }
    start = k + 1;
  }
  return content.slice(start, identEnd).replace(/\s+/g, "");
}

function readString(
  content: string,
  start: number
): { decoded: string; raw: string; start: number; end: number } {
  let i = start + 1;
  let decoded = "";
  while (i < content.length) {
    if (content[i] === "\\") {
      decoded += content[i + 1] ?? "";
      i += 2;
      continue;
    }
    if (content[i] === '"') {
      return { decoded, raw: decoded, start, end: i + 1 };
    }
    if (content[i] === "\n") {
      break;
    }
    decoded += content[i];
    i++;
  }
  return { decoded, raw: decoded, start, end: i };
}

function looksLikeChar(content: string, i: number): boolean {
  return content[i + 1] !== undefined && content[i + 1] !== "'" && content[i + 2] === "'";
}

function csharpString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function lineAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === "\n") {
      line++;
    }
  }
  return line;
}

function indexOfOrEnd(content: string, marker: string, from: number): number {
  const at = content.indexOf(marker, from);
  return at === -1 ? content.length : at + marker.length;
}

function isIdentStart(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z_]/.test(ch);
}

function isIdentChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch);
}
