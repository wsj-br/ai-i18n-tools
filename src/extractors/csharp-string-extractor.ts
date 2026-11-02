/**
 * C# / Razor / cshtml lexer for source-string calls.
 *
 * Catalogued: `T("...")`, `Tn("one", "{0} other", n)`, `Tp("menu", "Open")`,
 * `N("Light")`, `I18n.T("...")`, and `Loc["..."]` when the receiver is configured.
 * `$"..."`, concatenation, and `string.Format(...)` arguments are unsafe and
 * are not catalogued. `T(variable)` is reported so it is not skipped silently.
 */
import { hasDotnetNamedPlaceholder } from "../core/ui-placeholders.js";
import type { UiExtractedCall } from "./ui-string-babel.js";

const GENERATED_HELPER_MARKER = "ai-i18n-tools-i18n-cs:";

export function isGeneratedI18nCs(content: string): boolean {
  return content.includes(GENERATED_HELPER_MARKER);
}

export function isCSharpUiFile(relPath: string): boolean {
  const ext = relPath.toLowerCase();
  return ext.endsWith(".cs") || ext.endsWith(".razor") || ext.endsWith(".cshtml");
}

interface ReadArg {
  kind: "literal" | "interpolated" | "concat" | "format" | "other";
  decoded: string;
  start: number;
  end: number;
}

export function extractCSharpUiCalls(
  content: string,
  relPath: string,
  funcNames: string[],
  options?: { razor?: boolean }
): UiExtractedCall[] {
  const razor = options?.razor === true;
  const file = relPath.replace(/\\/g, "/");
  const names = new Set(funcNames);
  const calls: UiExtractedCall[] = [];
  let i = 0;
  while (i < content.length) {
    const ch = content[i]!;
    if (ch === "\n") {
      i++;
      continue;
    }
    if (razor && ch === "@" && content[i + 1] === "*") {
      i = skipUntil(content, i + 2, "*@");
      continue;
    }
    if (ch === "/" && content[i + 1] === "/") {
      i = skipLine(content, i + 2);
      continue;
    }
    if (ch === "/" && content[i + 1] === "*") {
      i = skipUntil(content, i + 2, "*/");
      continue;
    }
    if (razor && content.startsWith("<!--", i)) {
      i = skipUntil(content, i + 4, "-->");
      continue;
    }
    if (razor && ch === "@" && content[i + 1] === "@") {
      i += 2;
      continue;
    }
    if (razor && ch === "@" && isIdentStart(content[i + 1])) {
      i++;
      continue;
    }
    if (ch === "'" && looksLikeCharLiteral(content, i)) {
      i = skipCharLiteral(content, i);
      continue;
    }
    if (isStringStart(content, i)) {
      i = readString(content, i).end;
      continue;
    }
    if (!isIdentStart(ch)) {
      i++;
      continue;
    }
    const ident = readDottedName(content, i);
    if (!ident) {
      i++;
      continue;
    }
    const j = skipWs(content, ident.end);
    const last = ident.name.split(".").pop() ?? ident.name;
    if (content[j] === "(" && (names.has(ident.name) || names.has(last))) {
      const call = readCall(content, j, file, ident.start, last);
      if (call) {
        calls.push(call);
        i = call.end ?? j + 1;
        continue;
      }
    }
    if (content[j] === "[" && (names.has(ident.name) || names.has(last))) {
      const call = readIndexer(content, j, file, ident.start);
      if (call) {
        calls.push(call);
        i = call.end ?? j + 1;
        continue;
      }
    }
    i = ident.end;
  }
  return calls;
}

function readCall(
  content: string,
  openParen: number,
  file: string,
  start: number,
  method: string
): UiExtractedCall | null {
  const parsed = readArgList(content, openParen);
  if (!parsed) {
    return null;
  }
  const line = lineAt(content, start);
  if (method === "Tn") {
    return finishPlural(parsed.args, parsed.end, line, file, start);
  }
  if (method === "Tp") {
    return finishContext(parsed.args, parsed.end, line, file, start);
  }
  return finishSingle(parsed.args[0], parsed.end, line, file, start);
}

function readIndexer(
  content: string,
  openBracket: number,
  file: string,
  start: number
): UiExtractedCall | null {
  const parsed = readArgList(content, openBracket, "]");
  if (!parsed) {
    return null;
  }
  return finishSingle(parsed.args[0], parsed.end, lineAt(content, start), file, start);
}

function finishSingle(
  arg: ReadArg | undefined,
  end: number,
  line: number,
  file: string,
  start: number
): UiExtractedCall | null {
  if (!arg) {
    return null;
  }
  return annotate(
    {
      literal: arg.decoded,
      line,
      file,
      start,
      end,
      argStart: arg.start,
      argEnd: arg.end,
    },
    arg
  );
}

function finishPlural(
  args: ReadArg[],
  end: number,
  line: number,
  file: string,
  start: number
): UiExtractedCall | null {
  const singular = args[0];
  const plural = args[1];
  if (!singular || !plural) {
    return null;
  }
  if (singular.kind !== "literal" || plural.kind !== "literal") {
    return annotate(
      {
        literal: singular.decoded || plural.decoded,
        line,
        file,
        start,
        end,
        plurals: true,
      },
      singular.kind === "literal" ? plural : singular
    );
  }
  const call = annotate(
    {
      literal: singular.decoded,
      pluralSource: plural.decoded,
      plurals: true,
      line,
      file,
      start,
      end,
    },
    singular
  );
  if (hasDotnetNamedPlaceholder(plural.decoded.trim())) {
    call.namedPlaceholders = true;
    call.skipCatalog = true;
  }
  return call;
}

function finishContext(
  args: ReadArg[],
  end: number,
  line: number,
  file: string,
  start: number
): UiExtractedCall | null {
  const context = args[0];
  const message = args[1];
  if (!context || !message) {
    return null;
  }
  if (context.kind !== "literal" || message.kind !== "literal") {
    return annotate(
      {
        literal: message.decoded || context.decoded,
        line,
        file,
        start,
        end,
      },
      context.kind === "literal" ? message : context
    );
  }
  return annotate(
    {
      literal: message.decoded,
      context: context.decoded.trim(),
      line,
      file,
      start,
      end,
    },
    message
  );
}

function annotate(call: UiExtractedCall, arg: ReadArg): UiExtractedCall {
  const base: UiExtractedCall = { ...call, argStart: arg.start, argEnd: arg.end };
  if (arg.kind === "interpolated" || arg.kind === "concat" || arg.kind === "format") {
    return { ...base, unsafe: true, skipCatalog: true };
  }
  if (arg.kind !== "literal") {
    return { ...base, nonLiteral: true, skipCatalog: true, literal: arg.decoded || call.literal };
  }
  const trimmed = call.literal.trim();
  const next: UiExtractedCall = { ...base };
  if (trimmed !== call.literal && trimmed.length > 0) {
    next.edgeWhitespace = true;
  }
  if (hasDotnetNamedPlaceholder(trimmed)) {
    next.namedPlaceholders = true;
    next.skipCatalog = true;
  }
  if (!trimmed) {
    next.skipCatalog = true;
  }
  return next;
}

function readArgList(
  content: string,
  open: number,
  close = ")"
): { args: ReadArg[]; end: number } | null {
  let i = open + 1;
  const args: ReadArg[] = [];
  while (i < content.length) {
    i = skipWsAndComments(content, i);
    if (content[i] === close) {
      return { args, end: i + 1 };
    }
    const arg = readArg(content, i, close);
    if (!arg) {
      return null;
    }
    args.push(arg.value);
    i = skipWsAndComments(content, arg.end);
    if (content[i] === ",") {
      i++;
      continue;
    }
    if (content[i] === close) {
      return { args, end: i + 1 };
    }
    return null;
  }
  return null;
}

function readArg(
  content: string,
  start: number,
  close: string
): { value: ReadArg; end: number } | null {
  const stringAt = readString(content, skipWsAndComments(content, start));
  if (stringAt.start === skipWsAndComments(content, start) && stringAt.end > stringAt.start) {
    const after = skipWsAndComments(content, stringAt.end);
    if (content[after] === "+" || isTopLevelPlus(content, stringAt.end)) {
      const span = readUntilSeparator(content, start, close);
      return {
        value: { kind: "concat", decoded: content.slice(start, span).trim(), start, end: span },
        end: span,
      };
    }
    if (stringAt.interpolated) {
      return {
        value: {
          kind: "interpolated",
          decoded: content.slice(stringAt.start, stringAt.end),
          start: stringAt.start,
          end: stringAt.end,
        },
        end: stringAt.end,
      };
    }
    return {
      value: {
        kind: "literal",
        decoded: stringAt.decoded,
        start: stringAt.start,
        end: stringAt.end,
      },
      end: stringAt.end,
    };
  }
  const span = readUntilSeparator(content, start, close);
  const raw = content.slice(start, span).trim();
  if (/^(string|String)\.Format\s*\(/.test(raw)) {
    return { value: { kind: "format", decoded: raw, start, end: span }, end: span };
  }
  if (raw.includes("+")) {
    return { value: { kind: "concat", decoded: raw, start, end: span }, end: span };
  }
  return { value: { kind: "other", decoded: raw, start, end: span }, end: span };
}

function isTopLevelPlus(content: string, from: number): boolean {
  const i = skipWsAndComments(content, from);
  return content[i] === "+" && content[i + 1] !== "+" && content[i + 1] !== "=";
}

function readUntilSeparator(content: string, start: number, close: string): number {
  let i = start;
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  while (i < content.length) {
    const ch = content[i]!;
    if (ch === "/" && content[i + 1] === "/") {
      i = skipLine(content, i + 2);
      continue;
    }
    if (ch === "/" && content[i + 1] === "*") {
      i = skipUntil(content, i + 2, "*/");
      continue;
    }
    if (isStringStart(content, i)) {
      i = readString(content, i).end;
      continue;
    }
    if (ch === "'" && looksLikeCharLiteral(content, i)) {
      i = skipCharLiteral(content, i);
      continue;
    }
    if (ch === "(") {
      paren++;
    } else if (ch === ")") {
      if (paren === 0 && close === ")") {
        return i;
      }
      paren--;
    } else if (ch === "[") {
      bracket++;
    } else if (ch === "]") {
      if (bracket === 0 && close === "]") {
        return i;
      }
      bracket--;
    } else if (ch === "{") {
      brace++;
    } else if (ch === "}") {
      brace--;
    } else if (ch === "," && paren === 0 && bracket === 0 && brace === 0) {
      return i;
    }
    i++;
  }
  return i;
}

interface ReadString {
  start: number;
  end: number;
  decoded: string;
  interpolated: boolean;
}

function readString(content: string, start: number): ReadString {
  const empty: ReadString = { start, end: start, decoded: "", interpolated: false };
  let i = start;
  let interpolated = false;
  if (content[i] === "$") {
    interpolated = true;
    i++;
  }
  let verbatim = false;
  if (content[i] === "@") {
    verbatim = true;
    i++;
    if (content[i] === "$") {
      interpolated = true;
      i++;
    }
  }
  if (content[i] !== '"') {
    return empty;
  }
  const quoteRun = countQuotes(content, i);
  if (quoteRun >= 3) {
    const closeAt = findRawClose(content, i + quoteRun, quoteRun);
    const decoded = content.slice(i + quoteRun, closeAt);
    return {
      start,
      end: closeAt + quoteRun,
      decoded: trimRaw(decoded),
      interpolated,
    };
  }
  i++;
  let decoded = "";
  while (i < content.length) {
    const ch = content[i]!;
    if (verbatim && ch === '"') {
      if (content[i + 1] === '"') {
        decoded += '"';
        i += 2;
        continue;
      }
      return { start, end: i + 1, decoded, interpolated };
    }
    if (!verbatim && ch === "\\") {
      const esc = readEscape(content, i);
      decoded += esc.value;
      i = esc.end;
      continue;
    }
    if (!verbatim && ch === '"') {
      return { start, end: i + 1, decoded, interpolated };
    }
    if (!verbatim && ch === "\n") {
      return { start, end: i, decoded, interpolated };
    }
    decoded += ch;
    i++;
  }
  return { start, end: i, decoded, interpolated };
}

function isStringStart(content: string, i: number): boolean {
  const ch = content[i];
  if (ch === '"') {
    return true;
  }
  if (ch === "$" && (content[i + 1] === '"' || content[i + 1] === "@")) {
    return true;
  }
  if (ch === "@" && (content[i + 1] === '"' || content[i + 1] === "$")) {
    return true;
  }
  return false;
}

function countQuotes(content: string, i: number): number {
  let n = 0;
  while (content[i + n] === '"') {
    n++;
  }
  return n;
}

function findRawClose(content: string, from: number, quotes: number): number {
  let i = from;
  while (i < content.length) {
    if (content[i] === '"') {
      const run = countQuotes(content, i);
      if (run >= quotes) {
        return i;
      }
      i += run;
      continue;
    }
    i++;
  }
  return content.length;
}

function trimRaw(text: string): string {
  let value = text;
  if (value.startsWith("\r\n")) {
    value = value.slice(2);
  } else if (value.startsWith("\n")) {
    value = value.slice(1);
  }
  if (value.endsWith("\r\n")) {
    value = value.slice(0, -2);
  } else if (value.endsWith("\n")) {
    value = value.slice(0, -1);
  }
  return value;
}

function readEscape(content: string, i: number): { value: string; end: number } {
  const code = content[i + 1];
  if (code === undefined) {
    return { value: "\\", end: i + 1 };
  }
  const simple: Record<string, string> = {
    n: "\n",
    r: "\r",
    t: "\t",
    "\\": "\\",
    '"': '"',
    "'": "'",
    "0": "\0",
    a: "\u0007",
    b: "\b",
    f: "\f",
    v: "\v",
  };
  if (code in simple) {
    return { value: simple[code]!, end: i + 2 };
  }
  if (code === "u" && /^[0-9a-fA-F]{4}/.test(content.slice(i + 2, i + 6))) {
    return { value: String.fromCharCode(parseInt(content.slice(i + 2, i + 6), 16)), end: i + 6 };
  }
  if (code === "x") {
    const hex = content.slice(i + 2).match(/^[0-9a-fA-F]{1,4}/);
    if (hex) {
      return { value: String.fromCharCode(parseInt(hex[0], 16)), end: i + 2 + hex[0].length };
    }
  }
  return { value: code, end: i + 2 };
}

function looksLikeCharLiteral(content: string, i: number): boolean {
  if (content[i] !== "'") {
    return false;
  }
  if (content[i + 1] === "\\") {
    const esc = readEscape(content, i + 1);
    return content[esc.end] === "'";
  }
  return content[i + 1] !== undefined && content[i + 1] !== "'" && content[i + 2] === "'";
}

function skipCharLiteral(content: string, i: number): number {
  if (content[i + 1] === "\\") {
    return readEscape(content, i + 1).end + 1;
  }
  return i + 3;
}

function readDottedName(
  content: string,
  start: number
): { name: string; start: number; end: number } | null {
  if (!isIdentStart(content[start])) {
    return null;
  }
  let i = start + 1;
  while (isIdentChar(content[i])) {
    i++;
  }
  let name = content.slice(start, i);
  while (i < content.length) {
    if (content[i] === "." && isIdentStart(content[i + 1])) {
      let j = i + 2;
      while (isIdentChar(content[j])) {
        j++;
      }
      name += content.slice(i, j);
      i = j;
      continue;
    }
    if (content[i] === ":" && content[i + 1] === ":" && isIdentStart(content[i + 2])) {
      let j = i + 3;
      while (isIdentChar(content[j])) {
        j++;
      }
      name += "." + content.slice(i + 2, j);
      i = j;
      continue;
    }
    break;
  }
  return { name, start, end: i };
}

function skipWs(content: string, i: number): number {
  while (i < content.length && (content[i] === " " || content[i] === "\t" || content[i] === "\r")) {
    i++;
  }
  return i;
}

function skipWsAndComments(content: string, i: number): number {
  while (i < content.length) {
    if (content[i] === " " || content[i] === "\t" || content[i] === "\r" || content[i] === "\n") {
      i++;
      continue;
    }
    if (content[i] === "/" && content[i + 1] === "/") {
      i = skipLine(content, i + 2);
      continue;
    }
    if (content[i] === "/" && content[i + 1] === "*") {
      i = skipUntil(content, i + 2, "*/");
      continue;
    }
    break;
  }
  return i;
}

function skipLine(content: string, i: number): number {
  while (i < content.length && content[i] !== "\n") {
    i++;
  }
  return i;
}

function skipUntil(content: string, i: number, marker: string): number {
  const at = content.indexOf(marker, i);
  return at === -1 ? content.length : at + marker.length;
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

function isIdentStart(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z_]/.test(ch);
}

function isIdentChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch);
}
