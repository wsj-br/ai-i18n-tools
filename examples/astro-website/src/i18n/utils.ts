import { resolveUiLanguage } from "./locale.js";
import type { TranslateFn } from "./t.js";

/** BCP-47 code from `ui-languages.json` for the active Astro locale. */
export function resolvePageLocale(astroLocale: string | undefined): string {
  return resolveUiLanguage(astroLocale).code;
}

/** [Astro i18n recipe](https://docs.astro.build/en/recipes/i18n/) helper: returns the bound `t` for the active locale. */
export function useTranslations(_lang: string, t: TranslateFn): TranslateFn {
  return t;
}
