/**
 * After {@link PlaceholderHandler.restoreAfterTranslation}, these substrings must not remain
 * in markdown output (they indicate the model corrupted or omitted an internal token).
 */
const LEAK_PATTERN =
  /\{\{\s*(?:HDG[-_]?\d+|ANC[-_]?\d+|URL[-_]?\d+|BLD[-_]?\d+|ILC[-_]?\d+|ADM_(?:OPEN|END)_\d+|GLS[-_]?\d+|IT|IU|SE|SU|ST)\s*\}\}/i;

export function hasInternalPlaceholderLeak(text: string): boolean {
  return LEAK_PATTERN.test(text);
}
