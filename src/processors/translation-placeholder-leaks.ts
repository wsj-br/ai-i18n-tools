/**
 * After {@link PlaceholderHandler.restoreAfterTranslation}, these substrings must not remain
 * in markdown output (they indicate the model corrupted or omitted an internal token).
 */
const LEAK_PATTERN =
  /\{\{\s*(?:DOC_HEADING[-_]ID_\d+|HTML_ANCHOR_\d+|URL_PLACEHOLDER_\d+|ADM_(?:OPEN|END)_\d+|GLOSSARY_FORCE_\d+|IT|IU|SE|SU|ST)\s*\}\}/i;

export function hasInternalPlaceholderLeak(text: string): boolean {
  return LEAK_PATTERN.test(text);
}
