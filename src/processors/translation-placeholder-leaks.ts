/**
 * After {@link PlaceholderHandler.restoreAfterTranslation}, these substrings must not remain
 * in markdown output (they indicate the model corrupted or omitted an internal token).
 */
const LEAK_PATTERN =
  /\{\{\s*(?:DOC_HEADING[-_]ID_|HTML_ANCHOR_|URL_PLACEHOLDER_|ADM_(?:OPEN|END)_)/i;

export function hasInternalPlaceholderLeak(text: string): boolean {
  return LEAK_PATTERN.test(text);
}
