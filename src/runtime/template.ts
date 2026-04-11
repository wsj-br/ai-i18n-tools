/**
 * Small string helpers for i18next key-as-default setups.
 * No i18n dependency - safe for browser or Node.
 */

/**
 * Replace `{{key}}` placeholders (ASCII word keys only) in a pre-translated string.
 * Use for non-i18next contexts: CLI output, Node.js scripts, or strings already
 * returned by `t()` that need further substitution outside the React tree.
 *
 * In React/i18next components, prefer `t('key {{var}}', { var })` directly -
 * i18next handles interpolation natively in key-as-default mode.
 *
 * @example interpolateTemplate(t("Hello {{name}}"), { name: userName })
 */
export function interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

/**
 * Map U+2192 (→) to U+2190 (←) when the UI is RTL so arrows match reading direction.
 * Apply to user-visible strings that may contain → (including translated text).
 */
export function flipUiArrowsForRtl(
  text: string | null | undefined,
  isRtl: boolean
): string | null | undefined {
  if (!isRtl || text == null || typeof text !== "string") {
    return text;
  }
  return text.replace(/\u2192/g, "\u2190");
}
