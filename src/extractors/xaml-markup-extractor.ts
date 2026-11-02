/**
 * XAML / AXAML markup-extension extractor.
 *
 * `{loc:Tr 'Sign in'}` is a catalog string when `Tr` is a configured function name.
 * `{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}`, and
 * `{x:Static}` are ignored. Element text (`<TextBlock>Hello</TextBlock>`) is not extracted.
 */
import { hasDotnetNamedPlaceholder } from "../core/ui-placeholders.js";
import type { UiExtractedCall } from "./ui-string-babel.js";

const IGNORED_TYPES = new Set([
  "Binding",
  "DynamicResource",
  "StaticResource",
  "TemplateBinding",
  "Static",
]);

export function isXamlUiFile(relPath: string): boolean {
  const lower = relPath.toLowerCase();
  return lower.endsWith(".xaml") || lower.endsWith(".axaml");
}

export function extractXamlMarkupCalls(
  content: string,
  relPath: string,
  funcNames: string[]
): UiExtractedCall[] {
  const file = relPath.replace(/\\/g, "/");
  const names = new Set(funcNames);
  const calls: UiExtractedCall[] = [];
  let i = 0;
  while (i < content.length) {
    if (content.startsWith("<!--", i)) {
      const end = content.indexOf("-->", i + 4);
      i = end === -1 ? content.length : end + 3;
      continue;
    }
    if (content[i] !== "{") {
      i++;
      continue;
    }
    if (content[i + 1] === "{") {
      i += 2;
      continue;
    }
    const ext = readExtension(content, i + 1);
    if (!ext) {
      i++;
      continue;
    }
    const type = ext.type;
    if (IGNORED_TYPES.has(type) || !names.has(type)) {
      i = ext.end;
      continue;
    }
    const quoted = readQuoted(content, ext.valueStart);
    if (!quoted) {
      i = ext.end;
      continue;
    }
    const decoded = decodeXml(quoted.value);
    const line = lineAt(content, i);
    const call: UiExtractedCall = {
      literal: decoded,
      line,
      file,
      start: i,
      end: quoted.end,
    };
    if (decoded.trim() !== decoded && decoded.trim().length > 0) {
      call.edgeWhitespace = true;
    }
    if (!decoded.trim() || hasDotnetNamedPlaceholder(decoded.trim())) {
      call.skipCatalog = true;
      if (hasDotnetNamedPlaceholder(decoded.trim())) {
        call.namedPlaceholders = true;
      }
    }
    calls.push(call);
    i = quoted.end;
  }
  return calls;
}

interface ExtensionHead {
  type: string;
  valueStart: number;
  end: number;
}

function readExtension(content: string, start: number): ExtensionHead | null {
  let i = start;
  if (!isIdentStart(content[i])) {
    return null;
  }
  const first = readIdent(content, i);
  i = first.end;
  let type = first.text;
  if (content[i] === ":" && isIdentStart(content[i + 1])) {
    const second = readIdent(content, i + 1);
    type = second.text;
    i = second.end;
  }
  while (
    i < content.length &&
    (content[i] === " " || content[i] === "\t" || content[i] === "\n" || content[i] === "\r")
  ) {
    i++;
  }
  return { type, valueStart: i, end: i };
}

function readQuoted(content: string, start: number): { value: string; end: number } | null {
  const pairs: Array<[string, string]> = [
    ["'", "'"],
    ['"', '"'],
    ["&quot;", "&quot;"],
    ["&apos;", "&apos;"],
  ];
  for (const [open, close] of pairs) {
    if (!content.startsWith(open, start)) {
      continue;
    }
    const from = start + open.length;
    const at = content.indexOf(close, from);
    if (at === -1) {
      return null;
    }
    return { value: content.slice(from, at), end: at + close.length };
  }
  return null;
}

function decodeXml(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readIdent(content: string, start: number): { text: string; end: number } {
  let i = start + 1;
  while (isIdentChar(content[i])) {
    i++;
  }
  return { text: content.slice(start, i), end: i };
}

function lineAt(content: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index && i < content.length; i++) {
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
