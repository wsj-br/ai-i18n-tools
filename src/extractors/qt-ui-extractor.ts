/**
 * Qt Designer `.ui` extractor. `<string notr="true">` is skipped.
 * A `comment` attribute becomes the Gettext context.
 */
import type { UiExtractedCall } from "./ui-string-babel.js";

export function isQtUiFile(relPath: string): boolean {
  return relPath.toLowerCase().endsWith(".ui");
}

export function extractQtUiCalls(content: string, relPath: string): UiExtractedCall[] {
  const file = relPath.replace(/\\/g, "/");
  const calls: UiExtractedCall[] = [];
  const re = /<string\b([^>]*)>([\s\S]*?)<\/string>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const attrs = match[1] ?? "";
    if (/\bnotr\s*=\s*["']true["']/i.test(attrs)) {
      continue;
    }
    const value = decodeXml(match[2] ?? "").trim();
    if (!value) {
      continue;
    }
    const comment = attrs.match(/\bcomment\s*=\s*("([^"]*)"|'([^']*)')/);
    const context = decodeXml(comment?.[2] ?? comment?.[3] ?? "").trim();
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    calls.push({
      literal: value,
      line,
      file,
      ...(context ? { context } : {}),
    });
  }
  return calls;
}

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&amp;/g, "&");
}
