/** Standalone markdown image line: `![alt](url)` with no surrounding prose. */
export const STANDALONE_IMAGE_MARKDOWN_RE = /^!\[([^\]]*)\]\(([^)]*)\)$/;

export function parseStandaloneImageMarkdown(content: string): { alt: string; url: string } | null {
  const m = content.match(STANDALONE_IMAGE_MARKDOWN_RE);
  if (!m) {
    return null;
  }
  return { alt: m[1] ?? "", url: m[2] ?? "" };
}

export function formatImageMarkdown(alt: string, url: string): string {
  return `![${alt}](${url})`;
}

export function hasTranslatableImageAlt(alt: string): boolean {
  return /[A-Za-z0-9]/.test(alt);
}

/** Translated alt must remain plain text — no markdown image/link syntax or URL placeholders. */
export function imageAltTranslationErrors(alt: string): string[] {
  const errors: string[] = [];
  if (/!\[|\]\(|{{URL_/.test(alt)) {
    errors.push("Image alt contains markdown or placeholder leak");
  }
  return errors;
}
