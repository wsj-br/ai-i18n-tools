/**
 * After {@link PlaceholderHandler.restoreAfterTranslation}, these substrings must not remain
 * in markdown output (they indicate the model corrupted or omitted an internal token).
 */
const LEAK_PATTERN =
  /\{\{\s*(?:HDG[-_]?\d+|ANC[-_]?\d+|URL[-_]?\d+|BLD[-_]?\d+|ILC[-_]?\d+|HTM[-_]?\d+|MDX[-_]?\d+|JXA[-_]?\d+|ADM_(?:OPEN|END|TCLOSE)_\d+|GLS[-_]?\d+|IT|IU|SE|SU|ST)\s*\}\}|\|\|\s*JXA\d+:/i;

export function hasInternalPlaceholderLeak(text: string): boolean {
  return LEAK_PATTERN.test(text);
}
