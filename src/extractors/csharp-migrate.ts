/**
 * Rewrites unsafe .NET lookup arguments and, when asked, wraps unmarked UI strings.
 * A second run on the result is a no-op: safe calls are left alone, and wrapped
 * markup starts with `{` so it is not wrapped again.
 */
import { extractCSharpUiCalls, isCSharpUiFile } from "./csharp-string-extractor.js";
import { isXamlUiFile } from "./xaml-markup-extractor.js";

export const DEFAULT_WRAP_ATTRIBUTES = [
  "Text",
  "Header",
  "Content",
  "ToolTip.Tip",
  "Title",
  "PlaceholderText",
  "Watermark",
  "ToolTipText",
  "AutomationProperties.Name",
  "Label",
  "Description",
];

export const DEFAULT_WRAP_SUFFIXES = [
  "Text",
  "Title",
  "Header",
  "Content",
  "ToolTip",
  "Label",
  "Message",
  "Description",
  "Status",
];

export const DEFAULT_WRAP_CALLS = ["MessageBox.Show", "ConfirmDialog.Show"];

export interface DotnetMigrationEdit {
  line: number;
  before: string;
  after: string;
}

export interface DotnetMigrationNote {
  line: number;
  message: string;
}

export interface DotnetFileMigration {
  file: string;
  content: string;
  edits: DotnetMigrationEdit[];
  reviews: DotnetMigrationNote[];
  candidates: DotnetMigrationNote[];
}

export interface MigrateDotnetSourceOptions {
  wrap?: boolean;
  wrapAttributes?: string[];
  wrapSuffixes?: string[];
  wrapCalls?: string[];
}

interface PlannedEdit {
  start: number;
  end: number;
  line: number;
  before: string;
  after: string;
  review?: string;
}

export function migrateDotnetSource(
  content: string,
  funcNames: string[],
  file = "source.cs",
  options: MigrateDotnetSourceOptions = {}
): DotnetFileMigration {
  const planned: PlannedEdit[] = [];
  const reviews: DotnetMigrationNote[] = [];
  const candidates: DotnetMigrationNote[] = [];
  const xaml = isXamlUiFile(file);
  const csharp = isCSharpUiFile(file);

  if (csharp) {
    const calls = extractCSharpUiCalls(content, file, funcNames, {
      razor: file.toLowerCase().endsWith(".razor") || file.toLowerCase().endsWith(".cshtml"),
    });
    for (const call of calls) {
      if (!call.unsafe || call.argStart === undefined || call.argEnd === undefined) {
        continue;
      }
      const raw = content.slice(call.argStart, call.argEnd);
      const rewritten = rewriteUnsafeArgument(raw);
      if (!rewritten) {
        continue;
      }
      if ("review" in rewritten) {
        reviews.push({ line: call.line, message: rewritten.review });
        continue;
      }
      if (rewritten.replacement === raw) {
        continue;
      }
      planned.push({
        start: call.argStart,
        end: call.argEnd,
        line: call.line,
        before: raw,
        after: rewritten.replacement,
        ...(rewritten.note ? { review: rewritten.note } : {}),
      });
    }
  }

  if (options.wrap && xaml) {
    wrapXamlAttributes(
      content,
      options.wrapAttributes ?? DEFAULT_WRAP_ATTRIBUTES,
      planned,
      reviews
    );
  }
  if (options.wrap && csharp) {
    wrapCSharpSinks(content, funcNames, options, planned, candidates);
  }

  const applied = applyEdits(content, planned);
  for (const edit of applied.edits) {
    const extra = planned.find((item) => item.before === edit.before && item.review);
    if (extra?.review) {
      reviews.push({ line: edit.line, message: extra.review });
    }
  }
  return {
    file,
    content: applied.content,
    edits: applied.edits,
    reviews,
    candidates,
  };
}

function rewriteUnsafeArgument(
  raw: string
): { replacement: string; note?: string } | { review: string } | null {
  const trimmed = raw.trim();
  if (isInterpolated(trimmed)) {
    return rewriteInterpolation(trimmed);
  }
  if (/^(string|String)\.Format\s*\(/.test(trimmed)) {
    return rewriteFormatCall(trimmed);
  }
  if (trimmed.includes("+")) {
    return rewriteConcat(trimmed);
  }
  return null;
}

function isInterpolated(raw: string): boolean {
  return raw.startsWith("$") || raw.startsWith("@$");
}

function rewriteInterpolation(
  raw: string
): { replacement: string; note?: string } | { review: string } {
  if (raw.startsWith("$$")) {
    return { review: "raw interpolated string was not rewritten" };
  }
  const parsed = readInterpolatedBody(raw);
  if ("review" in parsed) {
    return parsed;
  }
  const built = buildFormat(parsed.parts);
  if ("review" in built) {
    return built;
  }
  if (looksPlural(built.template)) {
    return {
      review: `looks like a plural ("${built.template}"); use Tn("…", "…", count) instead of T()`,
    };
  }
  return { replacement: formatCall(built.template, built.args) };
}

interface InterpPart {
  text?: string;
  expr?: string;
  align?: string;
  format?: string;
}

function readInterpolatedBody(raw: string): { parts: InterpPart[] } | { review: string } {
  let i = 0;
  let verbatim = false;
  if (raw.startsWith("@$")) {
    verbatim = true;
    i = 2;
  } else if (raw.startsWith("$@")) {
    verbatim = true;
    i = 2;
  } else if (raw.startsWith("$")) {
    i = 1;
  }
  if (raw[i] !== '"') {
    return { review: "raw interpolated string was not rewritten" };
  }
  const quotes = countChar(raw, i, '"');
  if (quotes >= 3) {
    return { review: "raw interpolated string was not rewritten" };
  }
  i += 1;
  const parts: InterpPart[] = [];
  let text = "";
  while (i < raw.length) {
    if (!verbatim && raw[i] === "\\") {
      text += raw[i]! + (raw[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (raw[i] === '"') {
      if (verbatim && raw[i + 1] === '"') {
        text += '""';
        i += 2;
        continue;
      }
      break;
    }
    if (raw[i] === "{" && raw[i + 1] === "{") {
      text += "{{";
      i += 2;
      continue;
    }
    if (raw[i] === "}" && raw[i + 1] === "}") {
      text += "}}";
      i += 2;
      continue;
    }
    if (raw[i] === "{") {
      if (text) {
        parts.push({ text });
        text = "";
      }
      const hole = readHole(raw, i + 1);
      if ("review" in hole) {
        return hole;
      }
      parts.push(hole.part);
      i = hole.end;
      continue;
    }
    text += raw[i];
    i++;
  }
  if (text) {
    parts.push({ text });
  }
  return { parts };
}

function readHole(
  raw: string,
  start: number
): { part: InterpPart; end: number } | { review: string } {
  let i = start;
  let depth = 0;
  let mode: "expr" | "align" | "format" = "expr";
  let expr = "";
  let align = "";
  let format = "";
  while (i < raw.length) {
    const ch = raw[i]!;
    if (ch === "{") {
      depth++;
    }
    if (ch === "}" && depth === 0) {
      break;
    }
    if (ch === "}" && depth > 0) {
      depth--;
    }
    if (depth === 0 && mode === "expr" && ch === ",") {
      mode = "align";
      i++;
      continue;
    }
    if (depth === 0 && mode !== "format" && ch === ":") {
      mode = "format";
      i++;
      continue;
    }
    if (mode === "expr") {
      expr += ch;
    } else if (mode === "align") {
      align += ch;
    } else {
      format += ch;
    }
    i++;
  }
  if (raw[i] !== "}") {
    return { review: "unclosed interpolation hole was not rewritten" };
  }
  const expression = expr.trim();
  if (!expression) {
    return { review: "empty interpolation hole was not rewritten" };
  }
  if (expression.includes("?") || /\bawait\b/.test(expression) || expression.includes('$"')) {
    return {
      review: "interpolation hole needs manual review (await, nested interpolation, or ':')",
    };
  }
  if (/^(ref|out)\b/.test(expression)) {
    return { review: "ref or out interpolation hole was not rewritten" };
  }
  if (align && !/^-?\d+$/.test(align.trim())) {
    return { review: "interpolation alignment is not a constant and was not rewritten" };
  }
  if (format.includes("{") || format.includes("}")) {
    return { review: "nested interpolation hole was not rewritten" };
  }
  return {
    part: {
      expr: expression,
      ...(align ? { align: align.trim() } : {}),
      ...(format ? { format } : {}),
    },
    end: i + 1,
  };
}

function buildFormat(
  parts: InterpPart[]
): { template: string; args: string[] } | { review: string } {
  const args: string[] = [];
  const indexOf = new Map<string, number>();
  let template = "";
  for (const part of parts) {
    if (part.text !== undefined) {
      template += part.text;
      continue;
    }
    const expr = part.expr ?? "";
    const simple = isSimpleExpr(expr);
    let index = simple ? indexOf.get(expr) : undefined;
    if (index === undefined) {
      index = args.length;
      args.push(expr);
      if (simple) {
        indexOf.set(expr, index);
      }
    }
    let hole = `{${index}`;
    if (part.align) {
      hole += `,${part.align}`;
    }
    if (part.format) {
      hole += `:${part.format}`;
    }
    template += `${hole}}`;
  }
  return { template, args };
}

function isSimpleExpr(expr: string): boolean {
  return /^@?[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(expr);
}

function looksPlural(template: string): boolean {
  return /\{0(?:,-?\d+)?(?::[^}]*)?\} [A-Za-z]+s\b/.test(template);
}

function formatCall(template: string, args: string[]): string {
  const literal = csharpString(unescapeInterpolatedText(template));
  if (args.length === 0) {
    return literal;
  }
  return `${literal}, ${args.join(", ")}`;
}

/** Turn source-level `{{` / `\\n` text captured from an interpolation into format-string characters. */
function unescapeInterpolatedText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function csharpString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")}"`;
}

function rewriteFormatCall(raw: string): { replacement: string } | { review: string } {
  const open = raw.indexOf("(");
  const close = raw.lastIndexOf(")");
  if (open < 0 || close < open) {
    return { review: "string.Format call was not rewritten" };
  }
  const inner = raw.slice(open + 1, close);
  const args = splitTopLevel(inner, ",");
  const first = args[0]?.trim() ?? "";
  if (!first.startsWith('"') && !first.startsWith('@"')) {
    return { review: "string.Format IFormatProvider overload was not rewritten" };
  }
  const literal = readPlainString(first);
  if (!literal) {
    return { review: "string.Format first argument was not rewritten" };
  }
  const rest = args
    .slice(1)
    .map((arg) => arg.trim())
    .filter((arg) => arg.length > 0);
  if (!raw.trim().endsWith(")")) {
    return { review: "string.Format call was not rewritten" };
  }
  return { replacement: formatCall(literal, rest) };
}

function rewriteConcat(raw: string): { replacement: string } | { review: string } {
  const parts = splitTopLevel(raw, "+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length < 2) {
    return { review: "concatenation was not rewritten" };
  }
  const pieces: InterpPart[] = [];
  let literals = 0;
  for (const part of parts) {
    if (isInterpolated(part)) {
      return { review: "concatenation containing an interpolation was not rewritten" };
    }
    const literal = readPlainString(part);
    if (literal !== null) {
      literals++;
      pieces.push({ text: escapeFormatBraces(literal) });
      continue;
    }
    if (/^(ref|out)\b/.test(part)) {
      return { review: "ref or out concatenation was not rewritten" };
    }
    pieces.push({ expr: part });
  }
  if (literals === 0) {
    return { review: "concatenation made only of expressions was not rewritten" };
  }
  const built = buildFormat(pieces);
  if ("review" in built) {
    return built;
  }
  if (looksPlural(built.template)) {
    return {
      review: `looks like a plural ("${built.template}"); use Tn("…", "…", count) instead of T()`,
    };
  }
  return { replacement: formatCall(built.template, built.args) };
}

function escapeFormatBraces(text: string): string {
  return text.replace(/\{/g, "{{").replace(/\}/g, "}}");
}

function readPlainString(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith('@"')) {
    const body = trimmed.slice(2, trimmed.endsWith('"') ? -1 : undefined);
    return body.replace(/""/g, '"');
  }
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    return null;
  }
  return unescapeInterpolatedText(trimmed.slice(1, -1));
}

function splitTopLevel(source: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    if (ch === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
      if (i < 0) {
        break;
      }
      continue;
    }
    if (isStringStartAt(source, i)) {
      i = skipStringAt(source, i);
      continue;
    }
    if (ch === "(") {
      paren++;
    } else if (ch === ")") {
      paren--;
    } else if (ch === "[") {
      bracket++;
    } else if (ch === "]") {
      bracket--;
    } else if (ch === "{") {
      brace++;
    } else if (ch === "}") {
      brace--;
    } else if (ch === separator && paren === 0 && bracket === 0 && brace === 0) {
      parts.push(source.slice(start, i));
      start = i + 1;
    }
    i++;
  }
  parts.push(source.slice(start));
  return parts;
}

function isStringStartAt(source: string, i: number): boolean {
  const ch = source[i];
  return (
    ch === '"' ||
    (ch === "@" && source[i + 1] === '"') ||
    ch === "$" ||
    (ch === "@" && source[i + 1] === "$")
  );
}

function skipStringAt(source: string, i: number): number {
  if (source[i] === "$" || source[i] === "@") {
    let j = i;
    if (source[j] === "@" || source[j] === "$") {
      j++;
    }
    if (source[j] === "@" || source[j] === "$") {
      j++;
    }
    if (source[j] === '"') {
      return skipQuoted(source, j, source[j - 1] === "@" || source.startsWith("@", i));
    }
  }
  if (source[i] === '"') {
    return skipQuoted(source, i, false);
  }
  return i + 1;
}

function skipQuoted(source: string, quoteAt: number, verbatim: boolean): number {
  let i = quoteAt + 1;
  while (i < source.length) {
    if (verbatim && source[i] === '"' && source[i + 1] === '"') {
      i += 2;
      continue;
    }
    if (!verbatim && source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source[i] === '"') {
      return i + 1;
    }
    i++;
  }
  return i;
}

function wrapXamlAttributes(
  content: string,
  attributes: string[],
  planned: PlannedEdit[],
  reviews: DotnetMigrationNote[]
): void {
  const allowed = new Set(attributes);
  const re = /([A-Za-z_][\w.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const name = match[1] ?? "";
    const full = match[0];
    const quote = (match[2] ?? '"').startsWith("'") ? "'" : '"';
    const value = match[3] ?? match[4] ?? "";
    const line = lineAt(content, match.index);
    if (insideXmlComment(content, match.index)) {
      continue;
    }
    if (name === "StringFormat" || name.endsWith(".StringFormat")) {
      reviews.push({
        line,
        message: `StringFormat ${JSON.stringify(value)} was left in place; format it in C# with T()`,
      });
      continue;
    }
    const local = name.includes(".") ? name : name;
    if (!allowed.has(local) && !allowed.has(name)) {
      continue;
    }
    if (!value.trim() || value.trim().startsWith("{") || !isWrappableXamlText(value)) {
      if (value.includes("StringFormat")) {
        reviews.push({
          line,
          message: `StringFormat ${JSON.stringify(value)} was left in place; format it in C# with T()`,
        });
      }
      continue;
    }
    const wrapped = wrapMarkupValue(value, quote);
    const after = `${name}=${quote}${wrapped}${quote}`;
    if (after === full) {
      continue;
    }
    planned.push({ start: match.index, end: match.index + full.length, line, before: full, after });
  }
}

function isWrappableXamlText(value: string): boolean {
  const trimmed = value.trim();
  if (!/\p{L}/u.test(trimmed)) {
    return false;
  }
  return !/^\d+\p{L}$/u.test(trimmed);
}

function wrapMarkupValue(value: string, _quote: string): string {
  if (value.includes("'")) {
    return `{loc:Tr &quot;${value}&quot;}`;
  }
  return `{loc:Tr '${value}'}`;
}

function insideXmlComment(content: string, index: number): boolean {
  const open = content.lastIndexOf("<!--", index);
  if (open < 0) {
    return false;
  }
  const close = content.lastIndexOf("-->", index);
  return close < open;
}

function wrapCSharpSinks(
  content: string,
  funcNames: string[],
  options: MigrateDotnetSourceOptions,
  planned: PlannedEdit[],
  candidates: DotnetMigrationNote[]
): void {
  const suffixes = options.wrapSuffixes ?? DEFAULT_WRAP_SUFFIXES;
  const calls = new Set(options.wrapCalls ?? DEFAULT_WRAP_CALLS);
  const names = new Set(funcNames);
  let i = 0;
  while (i < content.length) {
    if (content[i] === "/" && content[i + 1] === "/") {
      i = content.indexOf("\n", i);
      if (i < 0) {
        break;
      }
      continue;
    }
    if (content[i] === "/" && content[i + 1] === "*") {
      const end = content.indexOf("*/", i + 2);
      i = end < 0 ? content.length : end + 2;
      continue;
    }
    if (
      !isStringStartAt(content, i) ||
      content[i] === "$" ||
      (content[i] === "@" && content[i + 1] === "$")
    ) {
      if (
        isInterpolated(content.slice(i, i + 2)) ||
        (content[i] === "$" && content[i + 1] === '"')
      ) {
        const end = skipStringAt(content, i);
        considerSink(content, i, end, names, suffixes, calls, planned, candidates);
        i = end;
        continue;
      }
      i++;
      continue;
    }
    if (content[i] === '"' || (content[i] === "@" && content[i + 1] === '"')) {
      const end = skipStringAt(content, i);
      considerSink(content, i, end, names, suffixes, calls, planned, candidates);
      i = end;
      continue;
    }
    i++;
  }
}

function considerSink(
  content: string,
  start: number,
  end: number,
  funcNames: Set<string>,
  suffixes: string[],
  calls: Set<string>,
  planned: PlannedEdit[],
  candidates: DotnetMigrationNote[]
): void {
  const raw = content.slice(start, end);
  const line = lineAt(content, start);
  const before = content.slice(Math.max(0, start - 160), start);
  const tail = before.replace(/\s+$/u, "");
  const call = tail.match(/([A-Za-z_][\w.]*)\s*\($/);
  const callName = call?.[1] ?? "";
  if (callName && (funcNames.has(callName) || funcNames.has(callName.split(".").pop() ?? ""))) {
    return;
  }
  const reason = sinkReason(tail, callName, suffixes, calls);
  if (reason === "wrap-assign" || reason === "wrap-call") {
    const rewritten = rewriteUnsafeArgument(raw);
    let inserted: string;
    if (!rewritten) {
      const literal = readPlainString(raw);
      if (literal === null) {
        candidates.push({ line, message: `unknown sink — ${JSON.stringify(raw)}` });
        return;
      }
      inserted = `T(${csharpString(literal)})`;
    } else if ("review" in rewritten) {
      candidates.push({ line, message: `${rewritten.review} — ${JSON.stringify(raw)}` });
      return;
    } else {
      inserted = `T(${rewritten.replacement})`;
    }
    planned.push({ start, end, line, before: raw, after: inserted });
    return;
  }
  if (reason) {
    candidates.push({ line, message: `${reason} — ${JSON.stringify(raw)}` });
  }
}

function sinkReason(
  tail: string,
  callName: string,
  suffixes: string[],
  calls: Set<string>
): string | null {
  if (/\bnameof\s*\($/.test(tail)) {
    return "nameof";
  }
  if (/==$|!=$/.test(tail.trim())) {
    return "comparison";
  }
  if (/\bPath\.[A-Za-z_][\w]*\s*\($/.test(tail)) {
    return "path";
  }
  if (
    /\b(Log|Logger|Console|Debug|Trace)\b[\w.]*\s*\($/.test(tail) ||
    /\.Log(?:Error|Warning|Information|Debug)?\s*\($/.test(tail)
  ) {
    return "log";
  }
  if (/\[[^\]]*$/.test(tail)) {
    return "attribute";
  }
  if (/Exception\s*\($/.test(tail) || /\bthrow\b/.test(tail)) {
    return "exception message";
  }
  if (callName && (calls.has(callName) || callName.endsWith(".Show"))) {
    return "wrap-call";
  }
  if (/=\s*$/.test(tail)) {
    const name = tail.match(/([A-Za-z_][\w]*)\s*=\s*$/)?.[1] ?? "";
    if (suffixes.some((suffix) => name.endsWith(suffix))) {
      return "wrap-assign";
    }
    return "unknown sink";
  }
  return null;
}

function applyEdits(
  content: string,
  planned: PlannedEdit[]
): { content: string; edits: DotnetMigrationEdit[] } {
  const sorted = [...planned].sort((a, b) => b.start - a.start);
  const taken: PlannedEdit[] = [];
  let next = content;
  for (const edit of sorted) {
    if (taken.some((item) => edit.start < item.end && edit.end > item.start)) {
      continue;
    }
    if (next.slice(edit.start, edit.end) !== edit.before) {
      continue;
    }
    next = next.slice(0, edit.start) + edit.after + next.slice(edit.end);
    taken.push(edit);
  }
  taken.sort((a, b) => a.line - b.line || a.start - b.start);
  return {
    content: next,
    edits: taken.map((edit) => ({ line: edit.line, before: edit.before, after: edit.after })),
  };
}

function lineAt(content: string, index: number): number {
  let n = 1;
  const stop = Math.min(index, content.length);
  for (let i = 0; i < stop; i++) {
    if (content[i] === "\n") {
      n++;
    }
  }
  return n;
}

function countChar(text: string, start: number, ch: string): number {
  let n = 0;
  while (text[start + n] === ch) {
    n++;
  }
  return n;
}
