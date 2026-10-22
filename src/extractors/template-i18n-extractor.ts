/**
 * Jinja2 and Django template i18n extractor.
 *
 * `{% trans %}` / `{% blocktrans %}` variable slots become `%(name)s`, which is the
 * msgid Babel and Django compile at runtime. Whitespace follows each framework:
 * Jinja `{% trans %}` strips and collapses whitespace; Django `{% blocktrans %}`
 * keeps internal whitespace unless the tag carries `trimmed`.
 */
import type { UiExtractedCall } from "./ui-string-babel.js";

const TEMPLATE_EXTENSIONS = new Set([".html", ".htm", ".jinja", ".jinja2", ".j2", ".txt"]);

export function isTemplateI18nFile(relPath: string): boolean {
  const dot = relPath.lastIndexOf(".");
  if (dot < 0) {
    return false;
  }
  return TEMPLATE_EXTENSIONS.has(relPath.slice(dot).toLowerCase());
}

interface Tag {
  name: string;
  args: string;
  line: number;
  end: number;
}

export function extractTemplateI18nCalls(
  content: string,
  relPath: string,
  funcNames: string[]
): UiExtractedCall[] {
  const file = relPath.replace(/\\/g, "/");
  const calls: UiExtractedCall[] = [];
  const names = new Set(funcNames.map((name) => name.split(".").pop() ?? name));
  let i = 0;
  let line = 1;
  let rawDepth = 0;

  const bump = (text: string): void => {
    for (const ch of text) {
      if (ch === "\n") {
        line++;
      }
    }
  };

  while (i < content.length) {
    if (content.startsWith("{#", i)) {
      const close = content.indexOf("#}", i + 2);
      const end = close === -1 ? content.length : close + 2;
      bump(content.slice(i, end));
      i = end;
      continue;
    }
    if (content.startsWith("{%", i)) {
      const tag = readTag(content, i, line);
      if (!tag) {
        bump(content[i] ?? "");
        i++;
        continue;
      }
      bump(content.slice(i, tag.end));
      const tagLine = tag.line;
      i = tag.end;
      if (tag.name === "raw") {
        rawDepth++;
        continue;
      }
      if (tag.name === "endraw") {
        rawDepth = Math.max(0, rawDepth - 1);
        continue;
      }
      if (rawDepth > 0) {
        continue;
      }
      if (
        (tag.name === "trans" || tag.name === "translate") &&
        (tag.args.includes('"') || tag.args.includes("'"))
      ) {
        const extracted = extractDjangoTrans(tag, file);
        if (extracted) {
          calls.push(extracted);
        }
        continue;
      }
      if (tag.name === "trans") {
        const block = readUntilTag(content, i, line, new Set(["endtrans"]));
        if (block) {
          calls.push(...transBlockCalls(block.body, tag.args, file, tagLine));
          bump(content.slice(i, block.end));
          i = block.end;
        }
        continue;
      }
      if (tag.name === "blocktrans" || tag.name === "blocktranslate") {
        const block = readUntilTag(
          content,
          i,
          line,
          new Set(["endblocktrans", "endblocktranslate"])
        );
        if (block) {
          calls.push(...blocktransCalls(block.body, tag.args, file, tagLine));
          bump(content.slice(i, block.end));
          i = block.end;
        }
        continue;
      }
      continue;
    }
    if (rawDepth === 0 && content.startsWith("{{", i)) {
      const close = content.indexOf("}}", i + 2);
      const end = close === -1 ? content.length : close + 2;
      const expr = content.slice(i + 2, close === -1 ? content.length : close);
      const exprLine = line;
      bump(content.slice(i, end));
      i = end;
      const extracted = extractExpressionCall(expr, file, exprLine, names);
      if (extracted) {
        calls.push(extracted);
      }
      continue;
    }
    if (content[i] === "\n") {
      line++;
    }
    i++;
  }
  return calls;
}

function readTag(content: string, start: number, line: number): Tag | null {
  if (!content.startsWith("{%", start)) {
    return null;
  }
  let i = start + 2;
  let quote: string | null = null;
  while (i < content.length) {
    const ch = content[i]!;
    if (quote) {
      if (ch === "\\" && i + 1 < content.length) {
        i += 2;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      i++;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      i++;
      continue;
    }
    if (ch === "%" && content[i + 1] === "}") {
      const inner = content
        .slice(start + 2, i)
        .trim()
        .replace(/^-+\s*/, "")
        .replace(/\s*-+$/, "");
      const match = inner.match(/^([A-Za-z_][A-Za-z0-9_]*)([\s\S]*)$/);
      if (!match) {
        return { name: "", args: inner, line, end: i + 2 };
      }
      return { name: match[1]!, args: (match[2] ?? "").trim(), line, end: i + 2 };
    }
    i++;
  }
  return null;
}

function readUntilTag(
  content: string,
  start: number,
  line: number,
  names: Set<string>
): { body: string; end: number } | null {
  let i = start;
  let quote: string | null = null;
  while (i < content.length) {
    if (!quote && content.startsWith("{%", i)) {
      const tag = readTag(content, i, line);
      if (tag && names.has(tag.name)) {
        return { body: content.slice(start, i), end: tag.end };
      }
      if (tag) {
        i = tag.end;
        continue;
      }
    }
    const ch = content[i]!;
    if (quote) {
      if (ch === quote) {
        quote = null;
      }
      i++;
      continue;
    }
    if (
      (ch === "'" || ch === '"') &&
      !content.startsWith("{%", i) &&
      !content.startsWith("{{", i)
    ) {
      quote = ch;
    }
    i++;
  }
  return null;
}

function transBlockCalls(
  body: string,
  args: string,
  file: string,
  line: number
): UiExtractedCall[] {
  const parts = splitPluralBody(body, "pluralize");
  const singular = normalizeJinjaTrans(parts.singular);
  if (!singular) {
    return [];
  }
  const plural = parts.plural === undefined ? undefined : normalizeJinjaTrans(parts.plural);
  return [
    {
      literal: singular,
      line,
      file,
      ...(plural ? { plurals: true, pluralSource: plural } : {}),
      ...(args.includes("noop") ? {} : {}),
    },
  ];
}

function blocktransCalls(
  body: string,
  args: string,
  file: string,
  line: number
): UiExtractedCall[] {
  const trimmed = /\btrimmed\b/.test(args);
  const context = readContextOption(args);
  const parts = splitPluralBody(body, "plural");
  const singular = normalizeDjangoBlock(parts.singular, trimmed);
  if (!singular) {
    return [];
  }
  const plural =
    parts.plural === undefined ? undefined : normalizeDjangoBlock(parts.plural, trimmed);
  return [
    {
      literal: singular,
      line,
      file,
      ...(plural ? { plurals: true, pluralSource: plural } : {}),
      ...(context ? { context } : {}),
    },
  ];
}

function splitPluralBody(body: string, pluralTag: string): { singular: string; plural?: string } {
  const re = new RegExp(`\\{%\\s*${pluralTag}\\s*%\\}`);
  const match = re.exec(body);
  if (!match) {
    return { singular: body };
  }
  return {
    singular: body.slice(0, match.index),
    plural: body.slice(match.index + match[0].length),
  };
}

/** Jinja `{% trans %}`: trim and collapse whitespace, `{{ var }}` → `%(var)s`. */
export function normalizeJinjaTrans(body: string): string {
  return collapseWhitespace(replaceTemplateVars(body)).trim();
}

/** Django `{% blocktrans %}`. `trimmed` matches Jinja collapsing; otherwise keep internal space. */
export function normalizeDjangoBlock(body: string, trimmed: boolean): string {
  const withVars = replaceTemplateVars(stripOneEdgeNewline(body));
  if (trimmed) {
    return collapseWhitespace(withVars).trim();
  }
  return withVars.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
}

function stripOneEdgeNewline(body: string): string {
  let text = body;
  if (text.startsWith("\r\n")) {
    text = text.slice(2);
  } else if (text.startsWith("\n")) {
    text = text.slice(1);
  }
  if (text.endsWith("\r\n")) {
    text = text.slice(0, -2);
  } else if (text.endsWith("\n")) {
    text = text.slice(0, -1);
  }
  return text;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ");
}

function replaceTemplateVars(body: string): string {
  return body.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)[^}]*\}\}/g, "%($1)s");
}

function extractDjangoTrans(tag: Tag, file: string): UiExtractedCall | null {
  if (/\bnoop\b/.test(tag.args)) {
    const literal = readQuoted(tag.args);
    if (!literal) {
      return null;
    }
    return {
      literal: literal.value,
      line: tag.line,
      file,
      ...(readContextOption(tag.args) ? { context: readContextOption(tag.args) } : {}),
    };
  }
  const literal = readQuoted(tag.args);
  if (!literal) {
    return null;
  }
  const context = readContextOption(tag.args);
  return {
    literal: literal.value,
    line: tag.line,
    file,
    ...(context ? { context } : {}),
  };
}

function readContextOption(args: string): string | undefined {
  const match = args.match(/\bcontext\s+("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/);
  if (!match?.[1]) {
    return undefined;
  }
  const decoded = decodeQuoted(match[1]);
  return decoded === null ? undefined : decoded;
}

function extractExpressionCall(
  expr: string,
  file: string,
  line: number,
  names: Set<string>
): UiExtractedCall | null {
  const trimmed = expr.trim();
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  if (!match) {
    return null;
  }
  const fn = match[1]!;
  if (!names.has(fn)) {
    return null;
  }
  const args = splitCommas(trimmed.slice(match[0].length, trimmed.lastIndexOf(")")));
  if (fn === "ngettext" || fn === "ungettext") {
    const singular = decodeQuoted(args[0] ?? "");
    const plural = decodeQuoted(args[1] ?? "");
    if (!singular || !plural) {
      return null;
    }
    return { literal: singular, pluralSource: plural, plurals: true, line, file };
  }
  if (fn === "pgettext") {
    const context = decodeQuoted(args[0] ?? "");
    const literal = decodeQuoted(args[1] ?? "");
    if (!context || !literal) {
      return null;
    }
    return { literal, context, line, file };
  }
  const literal = decodeQuoted(args[0] ?? "");
  if (!literal) {
    return null;
  }
  return { literal, line, file };
}

function readQuoted(text: string): { value: string } | null {
  const match = text.match(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/);
  if (!match?.[1]) {
    return null;
  }
  const value = decodeQuoted(match[1]);
  return value === null ? null : { value };
}

function decodeQuoted(token: string): string | null {
  const trimmed = token.trim();
  if (trimmed.length < 2) {
    return null;
  }
  const quote = trimmed[0];
  if ((quote !== '"' && quote !== "'") || trimmed[trimmed.length - 1] !== quote) {
    return null;
  }
  const body = trimmed.slice(1, -1);
  return body
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\(.)/g, "$1");
}

function splitCommas(args: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: string | null = null;
  let depth = 0;
  for (let i = 0; i < args.length; i++) {
    const ch = args[i]!;
    if (quote) {
      current += ch;
      if (ch === "\\" && i + 1 < args.length) {
        current += args[i + 1]!;
        i++;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }
    if (ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) {
    out.push(current.trim());
  }
  return out;
}
