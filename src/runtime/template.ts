/**
 * Small string helpers aligned with Transrewrt `src/renderer/utils/misc/formatUtils.js`
 * (`interpolateTemplate`, `flipUiArrowsForRtl`). No i18n dependency — safe for browser or Node.
 */

/**
 * Replace `{{key}}` placeholders (ASCII word keys only, same regex as Transrewrt).
 * Use when `t()` returns a static string and i18next does not interpolate (e.g. key-as-default setups).
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
