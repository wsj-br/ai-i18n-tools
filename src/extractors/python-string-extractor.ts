/**
 * Zero-dependency Python 3 lexer and i18n call extractor.
 *
 * Safe catalog strings are plain literals (`t("Hello, {name}!", name=name)`),
 * post-lookup `%` / `.format()`, and Python 3.14 template strings passed to
 * `t` / `translate`. Pre-evaluated `f` strings, in-argument `%`, and in-argument
 * `.format()` are extracted for migration and marked `unsafe`.
 */
import type { UiExtractedCall } from "./ui-string-babel.js";

const GENERATED_HELPER_MARKER = "ai-i18n-tools-i18n-py:";

const STRING_PREFIX =
  /^(?:[rR][fF]|[fF][rR]|[rR][bB]|[bB][rR]|[rR][tT]|[tT][rR]|[bB]|[fF]|[rR]|[tT]|[uU])/;

const PLURAL_TAILS = new Set(["ngettext", "ungettext", "ngettext_lazy", "ungettext_lazy"]);
const CONTEXT_PLURAL_TAILS = new Set(["npgettext", "npgettext_lazy"]);
const CONTEXT_TAILS = new Set(["pgettext", "pgettext_lazy"]);
const QT_TRANSLATE = new Set(["QCoreApplication.translate", "QApplication.translate"]);

export interface PythonInterpolation {
  expr: string;
  conversion: string;
  spec: string;
  debug: boolean;
  dynamicSpec: boolean;
  simple: boolean;
  /** Name used in the normalized template (`name` or `value_1`). */
  placeholderName: string;
}

export interface PyToken {
  kind: "ident" | "str" | "op" | "num";
  value: string;
  line: number;
  start: number;
  end: number;
  quote?: string;
  /** Index of the opening quote (prefix is excluded). */
  quoteStart?: number;
  fString?: boolean;
  tString?: boolean;
  bytes?: boolean;
  unclosed?: boolean;
  interps?: PythonInterpolation[];
}

export interface PythonCallSite extends UiExtractedCall {
  unsafeKind?: "f-string" | "modulo" | "format" | "template";
  review?: string;
  /** Full call replacement. Absent when the site needs a human review. */
  replacement?: string;
  start: number;
  end: number;
}

interface LineCounter {
  n: number;
}

interface ValueCounter {
  n: number;
}

/** True for the scaffolded helper, which must not be extracted as user copy. */
export function isGeneratedI18nPy(content: string): boolean {
  return content.includes(GENERATED_HELPER_MARKER);
}

export function lexPython(content: string): PyToken[] {
  const tokens: PyToken[] = [];
  const line: LineCounter = { n: 1 };
  let i = 0;
  while (i < content.length) {
    const ch = content[i]!;
    if (ch === "\n") {
      line.n++;
      i++;
      continue;
    }
    if (ch === "\r" || ch === " " || ch === "\t" || ch === "\f") {
      i++;
      continue;
    }
    if (ch === "#") {
      while (i < content.length && content[i] !== "\n") {
        i++;
      }
      continue;
    }
    const str = tryReadString(content, i, line, { n: 0 });
    if (str) {
      tokens.push(str);
      i = str.end;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      const startLine = line.n;
      i++;
      while (i < content.length && /[A-Za-z0-9_]/.test(content[i]!)) {
        i++;
      }
      tokens.push({
        kind: "ident",
        value: content.slice(start, i),
        line: startLine,
        start,
        end: i,
      });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      const start = i;
      const startLine = line.n;
      i++;
      while (i < content.length && /[0-9.xXa-fA-F_]/.test(content[i]!)) {
        i++;
      }
      tokens.push({ kind: "num", value: content.slice(start, i), line: startLine, start, end: i });
      continue;
    }
    const two = content.slice(i, i + 2);
    const multi = ["**", "//", "==", "!=", "<=", ">=", "->", "+=", "-=", "*=", "%=", "<<", ">>"];
    const value = multi.includes(two) ? two : ch;
    tokens.push({ kind: "op", value, line: line.n, start: i, end: i + value.length });
    i += value.length;
  }
  return tokens;
}

export function extractPythonUiCalls(
  content: string,
  relPath: string,
  funcNames: string[]
): UiExtractedCall[] {
  return findPythonI18nCalls(content, relPath, funcNames).map((site) => ({
    literal: site.literal,
    line: site.line,
    file: site.file,
    ...(site.plurals === true ? { plurals: true } : {}),
    ...(site.zeroDigit === true ? { zeroDigit: true } : {}),
    ...(site.pluralSource ? { pluralSource: site.pluralSource } : {}),
    ...(site.context ? { context: site.context } : {}),
    ...(site.unsafe ? { unsafe: true } : {}),
  }));
}

export function findPythonI18nCalls(
  content: string,
  relPath: string,
  funcNames: string[]
): PythonCallSite[] {
  const tokens = lexPython(content);
  const sites: PythonCallSite[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    if (tok.kind !== "ident") {
      continue;
    }
    const next = tokens[i + 1];
    if (!next || next.kind !== "op" || next.value !== "(") {
      continue;
    }
    const dotted = dottedNameEndingAt(tokens, i);
    if (!dotted || !funcNames.includes(dotted.name)) {
      continue;
    }
    const parsed = splitCallArgs(tokens, i + 1);
    if (!parsed) {
      continue;
    }
    const site = classifyCall(content, relPath, dotted, parsed, tokens);
    if (site) {
      sites.push(site);
    }
    i = parsed.closeIndex;
  }
  return sites;
}

function readStringPrefix(src: string, i: number): string {
  if (i > 0 && /[A-Za-z0-9_]/.test(src[i - 1]!)) {
    return "";
  }
  const match = src.slice(i).match(STRING_PREFIX);
  if (!match) {
    return "";
  }
  const prefix = match[0];
  const next = src[i + prefix.length];
  if (next !== "'" && next !== '"') {
    return "";
  }
  return prefix;
}

function tryReadString(
  src: string,
  start: number,
  line: LineCounter,
  counter: ValueCounter
): PyToken | null {
  const prefix = readStringPrefix(src, start);
  const quotePos = start + prefix.length;
  const quoteChar = src[quotePos];
  if (quoteChar !== "'" && quoteChar !== '"') {
    return null;
  }
  const triple = src.startsWith(quoteChar + quoteChar + quoteChar, quotePos);
  const quote = triple ? quoteChar + quoteChar + quoteChar : quoteChar;
  const isRaw = /r/i.test(prefix);
  const isF = /f/i.test(prefix);
  const isT = /t/i.test(prefix);
  const isBytes = /b/i.test(prefix);
  const isInterp = isF || isT;
  const startLine = line.n;
  let i = quotePos + quote.length;
  let decoded = "";
  const interps: PythonInterpolation[] = [];
  let closed = false;

  while (i < src.length) {
    if (!isRaw && src[i] === "\\") {
      const esc = decodeEscape(src, i, line);
      decoded += esc.text;
      i = esc.end;
      continue;
    }
    if (src.startsWith(quote, i) && !quoteIsEscaped(src, i)) {
      i += quote.length;
      closed = true;
      break;
    }
    if (isInterp && src[i] === "{" && src[i + 1] === "{") {
      decoded += "{";
      i += 2;
      continue;
    }
    if (isInterp && src[i] === "}" && src[i + 1] === "}") {
      decoded += "}";
      i += 2;
      continue;
    }
    if (isInterp && src[i] === "{") {
      const rep = readReplacement(src, i, line, counter);
      if (!rep) {
        decoded += "{";
        i++;
        continue;
      }
      interps.push(rep.interp);
      decoded += rep.placeholder;
      i = rep.end;
      continue;
    }
    if (src[i] === "\n") {
      line.n++;
    }
    decoded += src[i]!;
    i++;
  }

  return {
    kind: "str",
    value: decoded,
    line: startLine,
    start,
    end: i,
    quote,
    quoteStart: quotePos,
    fString: isF,
    tString: isT,
    bytes: isBytes,
    unclosed: !closed,
    interps,
  };
}

function quoteIsEscaped(src: string, quoteIndex: number): boolean {
  let slashes = 0;
  let j = quoteIndex - 1;
  while (j >= 0 && src[j] === "\\") {
    slashes++;
    j--;
  }
  return slashes % 2 === 1;
}

function decodeEscape(
  src: string,
  slash: number,
  line: LineCounter
): { text: string; end: number } {
  const n = src[slash + 1];
  if (n === undefined) {
    return { text: "\\", end: slash + 1 };
  }
  const simple: Record<string, string> = {
    n: "\n",
    t: "\t",
    r: "\r",
    "\\": "\\",
    "'": "'",
    '"': '"',
    a: "\u0007",
    b: "\b",
    f: "\f",
    v: "\v",
  };
  if (simple[n] !== undefined) {
    return { text: simple[n]!, end: slash + 2 };
  }
  if (n === "\n") {
    line.n++;
    return { text: "", end: slash + 2 };
  }
  if (n === "N" && src[slash + 2] === "{") {
    const close = src.indexOf("}", slash + 3);
    if (close !== -1) {
      return { text: src.slice(slash, close + 1), end: close + 1 };
    }
  }
  const hexLen = n === "x" ? 2 : n === "u" ? 4 : n === "U" ? 8 : 0;
  if (hexLen > 0) {
    const digits = src.slice(slash + 2, slash + 2 + hexLen);
    if (digits.length === hexLen && /^[0-9a-fA-F]+$/.test(digits)) {
      const cp = Number.parseInt(digits, 16);
      return {
        text: Number.isFinite(cp) ? String.fromCodePoint(cp) : digits,
        end: slash + 2 + hexLen,
      };
    }
  }
  if (/[0-7]/.test(n)) {
    let j = slash + 1;
    let oct = "";
    while (oct.length < 3 && j < src.length && /[0-7]/.test(src[j]!)) {
      oct += src[j]!;
      j++;
    }
    return { text: String.fromCharCode(Number.parseInt(oct, 8)), end: j };
  }
  return { text: n, end: slash + 2 };
}

function readReplacement(
  src: string,
  open: number,
  line: LineCounter,
  counter: ValueCounter
): { end: number; placeholder: string; interp: PythonInterpolation } | null {
  if (src[open] !== "{") {
    return null;
  }
  const expr = readExpr(src, open + 1, line);
  if (expr.stop === "eof") {
    return null;
  }
  let i = expr.end;
  let conversion = "";
  let spec = "";
  let debug = false;
  let dynamicSpec = false;

  const takeConversion = (): void => {
    if (src[i] === "!" && src[i + 1] !== undefined && "rsa".includes(src[i + 1]!)) {
      const after = src[i + 2];
      if (after === ":" || after === "}") {
        conversion = src.slice(i, i + 2);
        i += 2;
      }
    }
  };
  const takeSpec = (): void => {
    if (src[i] !== ":") {
      return;
    }
    i++;
    const read = readFormatSpec(src, i, line, counter);
    spec = read.spec;
    dynamicSpec = read.dynamic;
    i = read.end;
  };

  if (expr.stop === "eq") {
    debug = true;
    i++;
    takeConversion();
    takeSpec();
  } else if (expr.stop === "bang") {
    takeConversion();
    takeSpec();
  } else if (expr.stop === "colon") {
    takeSpec();
  }

  if (src[i] !== "}") {
    return null;
  }
  const simple = /^[A-Za-z_][A-Za-z0-9_]*$/.test(expr.expr) && !debug && !dynamicSpec;
  const placeholderName = simple ? expr.expr : `value_${++counter.n}`;
  const placeholder = simple
    ? `{${expr.expr}${conversion}${spec.length > 0 ? `:${spec}` : ""}}`
    : `{${placeholderName}}`;
  return {
    end: i + 1,
    placeholder,
    interp: {
      expr: expr.expr,
      conversion,
      spec,
      debug,
      dynamicSpec,
      simple,
      placeholderName,
    },
  };
}

function readFormatSpec(
  src: string,
  start: number,
  line: LineCounter,
  counter: ValueCounter
): { spec: string; end: number; dynamic: boolean } {
  let spec = "";
  let dynamic = false;
  let i = start;
  while (i < src.length) {
    if (src[i] === "{") {
      dynamic = true;
      const nested = readReplacement(src, i, line, counter);
      if (!nested) {
        break;
      }
      spec += nested.placeholder;
      i = nested.end;
      continue;
    }
    if (src[i] === "}") {
      break;
    }
    if (src[i] === "\n") {
      line.n++;
    }
    spec += src[i]!;
    i++;
  }
  return { spec, end: i, dynamic };
}

function readExpr(
  src: string,
  start: number,
  line: LineCounter
): { expr: string; end: number; stop: "brace" | "colon" | "bang" | "eq" | "eof" } {
  let i = start;
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (c === "'" || c === '"') {
      const nested = tryReadString(src, i, line, { n: 0 });
      if (nested) {
        i = nested.end;
        continue;
      }
    }
    if (c === "(") {
      paren++;
    } else if (c === ")" && paren > 0) {
      paren--;
    } else if (c === "[") {
      bracket++;
    } else if (c === "]" && bracket > 0) {
      bracket--;
    } else if (c === "{") {
      brace++;
    } else if (c === "}") {
      if (brace > 0) {
        brace--;
      } else if (paren === 0 && bracket === 0) {
        return { expr: src.slice(start, i).trim(), end: i, stop: "brace" };
      }
    } else if (paren === 0 && bracket === 0 && brace === 0) {
      if (c === ":") {
        return { expr: src.slice(start, i).trim(), end: i, stop: "colon" };
      }
      if (c === "!" && src[i + 1] !== "=") {
        return { expr: src.slice(start, i).trim(), end: i, stop: "bang" };
      }
      if (
        c === "=" &&
        src[i + 1] !== "=" &&
        src[i - 1] !== "=" &&
        src[i - 1] !== "!" &&
        src[i - 1] !== "<" &&
        src[i - 1] !== ">"
      ) {
        return { expr: src.slice(start, i).trim(), end: i, stop: "eq" };
      }
    }
    if (c === "\n") {
      line.n++;
    }
    i++;
  }
  return { expr: src.slice(start, i).trim(), end: i, stop: "eof" };
}

function dottedNameEndingAt(
  tokens: PyToken[],
  index: number
): { name: string; start: number; end: number } | null {
  const tok = tokens[index];
  if (!tok || tok.kind !== "ident") {
    return null;
  }
  const parts = [tok.value];
  let i = index;
  while (
    i >= 2 &&
    tokens[i - 1]?.kind === "op" &&
    tokens[i - 1]?.value === "." &&
    tokens[i - 2]?.kind === "ident"
  ) {
    parts.push(tokens[i - 2]!.value);
    i -= 2;
  }
  parts.reverse();
  return { name: parts.join("."), start: tokens[i]!.start, end: tok.end };
}

interface SplitArgs {
  args: PyToken[][];
  closeIndex: number;
}

function splitCallArgs(tokens: PyToken[], openIndex: number): SplitArgs | null {
  const open = tokens[openIndex];
  if (!open || open.kind !== "op" || open.value !== "(") {
    return null;
  }
  let paren = 1;
  let bracket = 0;
  let brace = 0;
  let current: PyToken[] = [];
  const args: PyToken[][] = [];
  for (let i = openIndex + 1; i < tokens.length; i++) {
    const tok = tokens[i]!;
    if (tok.kind === "op") {
      if (tok.value === "(") {
        paren++;
      } else if (tok.value === ")") {
        paren--;
        if (paren === 0 && bracket === 0 && brace === 0) {
          if (current.length > 0) {
            args.push(current);
          }
          return { args, closeIndex: i };
        }
      } else if (tok.value === "[") {
        bracket++;
      } else if (tok.value === "]") {
        bracket = Math.max(0, bracket - 1);
      } else if (tok.value === "{") {
        brace++;
      } else if (tok.value === "}") {
        brace = Math.max(0, brace - 1);
      } else if (tok.value === "," && paren === 1 && bracket === 0 && brace === 0) {
        if (current.length > 0) {
          args.push(current);
        }
        current = [];
        continue;
      }
    }
    current.push(tok);
  }
  return null;
}

function tailName(dotted: string): string {
  const parts = dotted.split(".");
  return parts[parts.length - 1] ?? dotted;
}

function classifyCall(
  content: string,
  relPath: string,
  dotted: { name: string; start: number; end: number },
  parsed: SplitArgs,
  tokens: PyToken[]
): PythonCallSite | null {
  const tail = tailName(dotted.name);
  const close = tokens[parsed.closeIndex];
  if (!close) {
    return null;
  }
  const flags = readKeywordFlags(parsed.args);
  const base = {
    line: tokens.find((t) => t.start === dotted.start)?.line ?? 1,
    file: relPath.replace(/\\/g, "/"),
    start: dotted.start,
    end: close.end,
  };

  if (CONTEXT_PLURAL_TAILS.has(tail)) {
    const ctx = plainString(parsed.args[0]);
    const singular = messageString(parsed.args[1]);
    const plural = messageString(parsed.args[2]);
    if (!ctx || !singular || !plural) {
      return null;
    }
    return {
      ...base,
      literal: singular.value,
      pluralSource: plural.value,
      context: ctx,
      plurals: true,
      ...unsafeOf(singular, plural),
    };
  }
  if (PLURAL_TAILS.has(tail) || dotted.name === "i18n.ngettext") {
    const singular = messageString(parsed.args[0]);
    const plural = messageString(parsed.args[1]);
    if (!singular || !plural) {
      return null;
    }
    return {
      ...base,
      literal: singular.value,
      pluralSource: plural.value,
      plurals: true,
      ...unsafeOf(singular, plural),
    };
  }
  if (CONTEXT_TAILS.has(tail) || QT_TRANSLATE.has(dotted.name)) {
    const ctx = plainString(parsed.args[0]);
    const msg = messageString(parsed.args[1]);
    if (!ctx || !msg) {
      return null;
    }
    return {
      ...base,
      literal: msg.value,
      context: ctx,
      ...unsafeOf(msg),
    };
  }
  if (tail === "translate" && parsed.args.length >= 2) {
    const ctx = plainString(parsed.args[0]);
    const msg = messageString(parsed.args[1]);
    if (ctx && msg && !parsed.args[0]?.some((t) => t.kind === "str" && (t.fString || t.tString))) {
      return {
        ...base,
        literal: msg.value,
        context: ctx,
        ...unsafeOf(msg),
      };
    }
  }

  const messageArg = parsed.args[0];
  const msg = messageString(messageArg);
  if (!msg || msg.bytes || msg.unclosed) {
    return null;
  }
  const inside = insideArgKind(messageArg);
  const acceptsTemplate = tail === "t" || tail === "translate";
  let unsafe = false;
  let unsafeKind: PythonCallSite["unsafeKind"];
  let review: string | undefined;
  let replacement: string | undefined;

  if (msg.fString) {
    unsafe = true;
    unsafeKind = "f-string";
    const built = buildFStringReplacement(content, msg, parsed.args.length === 1);
    replacement = built.replacement;
    review = built.review;
  } else if (msg.tString && !acceptsTemplate) {
    unsafe = true;
    unsafeKind = "template";
    review = "template string is only safe when passed to t() or translate()";
  } else if (inside === "modulo" && messageArg) {
    unsafe = true;
    unsafeKind = "modulo";
    replacement = buildModuloReplacement(content, dotted.name, messageArg);
  } else if (inside === "format" && messageArg) {
    unsafe = true;
    unsafeKind = "format";
    const built = buildFormatReplacement(content, messageArg);
    replacement = built.replacement;
    review = built.review;
  }

  return {
    ...base,
    literal: msg.value,
    ...(flags.plurals ? { plurals: true } : {}),
    ...(flags.zeroDigit ? { zeroDigit: true } : {}),
    ...(unsafe ? { unsafe: true, unsafeKind } : {}),
    ...(review ? { review } : {}),
    ...(replacement ? { replacement } : {}),
  };
}

function readKeywordFlags(args: PyToken[][]): { plurals: boolean; zeroDigit: boolean } {
  let plurals = false;
  let zeroDigit = false;
  for (const arg of args) {
    if (arg.length < 3) {
      continue;
    }
    const [name, eq, value] = arg;
    if (!name || !eq || !value || name.kind !== "ident" || eq.kind !== "op" || eq.value !== "=") {
      continue;
    }
    const flag = value.kind === "ident" && (value.value === "True" || value.value === "true");
    if (!flag) {
      continue;
    }
    if (name.value === "plurals") {
      plurals = true;
    }
    if (name.value === "zero_digit" || name.value === "zeroDigit") {
      zeroDigit = true;
    }
  }
  return { plurals, zeroDigit };
}

function messageString(arg: PyToken[] | undefined): PyToken | null {
  if (!arg || arg.length === 0) {
    return null;
  }
  const strings = leadingStrings(arg);
  if (strings.length === 0) {
    return null;
  }
  if (strings.some((s) => s.bytes || s.unclosed)) {
    return null;
  }
  if (strings.length === 1) {
    return strings[0]!;
  }
  const first = strings[0]!;
  return {
    ...first,
    value: strings.map((s) => s.value).join(""),
    end: strings[strings.length - 1]!.end,
    fString: strings.some((s) => s.fString),
    tString: strings.some((s) => s.tString),
    interps: strings.flatMap((s) => s.interps ?? []),
  };
}

function plainString(arg: PyToken[] | undefined): string | null {
  const msg = messageString(arg);
  if (!msg || msg.fString || msg.tString) {
    return null;
  }
  if (arg && insideArgKind(arg)) {
    return null;
  }
  return msg.value;
}

function leadingStrings(arg: PyToken[]): PyToken[] {
  const out: PyToken[] = [];
  for (const tok of arg) {
    if (tok.kind === "str") {
      out.push(tok);
      continue;
    }
    break;
  }
  return out;
}

function insideArgKind(arg: PyToken[] | undefined): "modulo" | "format" | null {
  if (!arg) {
    return null;
  }
  const strings = leadingStrings(arg);
  if (strings.length === 0) {
    return null;
  }
  const rest = arg.slice(strings.length);
  if (rest[0]?.kind === "op" && rest[0].value === "%") {
    return "modulo";
  }
  if (
    rest[0]?.kind === "op" &&
    rest[0].value === "." &&
    rest[1]?.kind === "ident" &&
    rest[1].value === "format" &&
    rest[2]?.kind === "op" &&
    rest[2].value === "("
  ) {
    return "format";
  }
  return null;
}

function unsafeOf(...tokens: Array<PyToken | null>): { unsafe?: boolean } {
  if (tokens.some((tok) => tok && (tok.fString || insideArgKind([tok])))) {
    return { unsafe: true };
  }
  return {};
}

function buildFStringReplacement(
  content: string,
  msg: PyToken,
  onlyArg: boolean
): { replacement?: string; review?: string } {
  if (!onlyArg) {
    return { review: "f-string call has extra arguments; rewrite it by hand" };
  }
  const interps = msg.interps ?? [];
  if (interps.some((item) => item.debug || item.dynamicSpec)) {
    return {
      review:
        "f-string uses a debug expression ({value=}) or a nested format spec; rewrite it by hand",
    };
  }
  const simple = interps.every((item) => item.simple);
  const quoted =
    simple && msg.quoteStart !== undefined
      ? content.slice(msg.quoteStart, msg.end)
      : quotePython(msg.quote ?? '"', msg.value);
  const kwargs = keywordList(interps);
  const args = kwargs.length > 0 ? `${quoted}, ${kwargs}` : quoted;
  return {
    replacement: `t(${args})`,
    ...(simple
      ? {}
      : {
          review:
            "a complex expression was bound to a generated placeholder; confirm the name before shipping",
        }),
  };
}

function keywordList(interps: PythonInterpolation[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const interp of interps) {
    if (seen.has(interp.placeholderName)) {
      continue;
    }
    seen.add(interp.placeholderName);
    parts.push(`${interp.placeholderName}=${interp.expr}`);
  }
  return parts.join(", ");
}

function buildModuloReplacement(
  content: string,
  funcName: string,
  arg: PyToken[]
): string | undefined {
  const strings = leadingStrings(arg);
  const rest = arg.slice(strings.length);
  const literal = strings[0];
  if (!literal?.quoteStart || rest[0]?.value !== "%" || rest.length < 2) {
    return undefined;
  }
  if (strings.some((s) => s.fString || s.tString)) {
    return undefined;
  }
  const quoted = content.slice(literal.quoteStart, strings[strings.length - 1]!.end);
  const expr = content.slice(rest[1]!.start, rest[rest.length - 1]!.end);
  return `${funcName}(${quoted}) % ${expr}`;
}

function buildFormatReplacement(
  content: string,
  arg: PyToken[]
): { replacement?: string; review?: string } {
  const strings = leadingStrings(arg);
  const literal = strings[0];
  if (!literal?.quoteStart || strings.some((s) => s.fString)) {
    return { review: "formatted f-string needs a manual rewrite" };
  }
  const rest = arg.slice(strings.length);
  const open = rest.findIndex((tok) => tok.kind === "op" && tok.value === "(");
  const close = findMatchingParen(rest, open);
  if (open < 0 || close < 0) {
    return { review: ".format() call is not a simple argument list" };
  }
  const innerTokens = rest.slice(open + 1, close);
  const innerArgs = splitInnerArgs(innerTokens);
  const quoted = content.slice(literal.quoteStart, strings[strings.length - 1]!.end);
  if (innerArgs.length === 0) {
    return { replacement: `t(${quoted})` };
  }
  if (innerArgs.every((part) => isKeywordArg(part))) {
    const inner = innerArgs
      .map((part) => content.slice(part[0]!.start, part[part.length - 1]!.end))
      .join(", ");
    return { replacement: `t(${quoted}, ${inner})` };
  }
  if (innerArgs.every((part) => !isKeywordArg(part))) {
    const fields = formatFieldNames(literal.value);
    if (
      fields.length !== innerArgs.length ||
      fields.some((name) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
    ) {
      return { review: "positional .format() fields could not be named safely" };
    }
    const kwargs = innerArgs
      .map((part, index) => {
        const expr = content.slice(part[0]!.start, part[part.length - 1]!.end);
        return `${fields[index]}=${expr}`;
      })
      .join(", ");
    return { replacement: `t(${quoted}, ${kwargs})` };
  }
  return { review: "mixed positional and keyword .format() needs a manual rewrite" };
}

function findMatchingParen(tokens: PyToken[], open: number): number {
  if (open < 0) {
    return -1;
  }
  let depth = 0;
  for (let i = open; i < tokens.length; i++) {
    const tok = tokens[i]!;
    if (tok.kind === "op" && tok.value === "(") {
      depth++;
    } else if (tok.kind === "op" && tok.value === ")") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function splitInnerArgs(tokens: PyToken[]): PyToken[][] {
  const args: PyToken[][] = [];
  let current: PyToken[] = [];
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  for (const tok of tokens) {
    if (tok.kind === "op" && tok.value === "(") {
      paren++;
    } else if (tok.kind === "op" && tok.value === ")") {
      paren = Math.max(0, paren - 1);
    } else if (tok.kind === "op" && tok.value === "[") {
      bracket++;
    } else if (tok.kind === "op" && tok.value === "]") {
      bracket = Math.max(0, bracket - 1);
    } else if (tok.kind === "op" && tok.value === "{") {
      brace++;
    } else if (tok.kind === "op" && tok.value === "}") {
      brace = Math.max(0, brace - 1);
    } else if (
      tok.kind === "op" &&
      tok.value === "," &&
      paren === 0 &&
      bracket === 0 &&
      brace === 0
    ) {
      if (current.length > 0) {
        args.push(current);
      }
      current = [];
      continue;
    }
    current.push(tok);
  }
  if (current.length > 0) {
    args.push(current);
  }
  return args;
}

function isKeywordArg(arg: PyToken[]): boolean {
  return (
    arg.length >= 3 && arg[0]?.kind === "ident" && arg[1]?.kind === "op" && arg[1]?.value === "="
  );
}

function formatFieldNames(template: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const re = /\{([A-Za-z_][A-Za-z0-9_]*|[0-9]+)?(?:![rsa])?(?::[^}]*)?\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    const name = match[1] ?? "";
    if (name === "" || seen.has(name)) {
      if (name === "") {
        names.push("");
      }
      continue;
    }
    seen.add(name);
    names.push(name);
  }
  return names;
}

function quotePython(quote: string, value: string): string {
  if (quote.length === 3) {
    const escaped = value.replace(new RegExp(quote, "g"), "\\" + quote);
    return quote + escaped + quote;
  }
  const q = quote === "'" ? "'" : '"';
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(new RegExp(q, "g"), `\\${q}`)
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
  return q + escaped + q;
}
