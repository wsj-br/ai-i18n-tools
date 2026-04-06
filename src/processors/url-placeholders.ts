/**
 * Protect markdown link destinations from translation (`](url)` → placeholder).
 */

const PLACEHOLDER_PREFIX = "{{URL_PLACEHOLDER_";
const PLACEHOLDER_SUFFIX = "}}";

const MARKDOWN_URL_REGEX = /\]\(([^)]*)\)/g;

export interface ProtectedUrlResult {
  protected: string;
  urlMap: string[];
}

export function protectMarkdownUrls(text: string): ProtectedUrlResult {
  const urlMap: string[] = [];
  let placeholderIndex = 0;

  const protectedText = text.replace(MARKDOWN_URL_REGEX, (match, url: string) => {
    const placeholder = `${PLACEHOLDER_PREFIX}${placeholderIndex}${PLACEHOLDER_SUFFIX}`;
    urlMap.push(url);
    placeholderIndex++;
    return `](${placeholder})`;
  });

  return { protected: protectedText, urlMap };
}

export function restoreMarkdownUrls(text: string, urlMap: string[]): string {
  if (urlMap.length === 0) {
    return text;
  }
  let restored = text;
  for (let i = 0; i < urlMap.length; i++) {
    const placeholder = `${PLACEHOLDER_PREFIX}${i}${PLACEHOLDER_SUFFIX}`;
    restored = restored.split(placeholder).join(urlMap[i]);
  }
  return restored;
}
