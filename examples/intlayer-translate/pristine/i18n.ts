export const SOURCE_LOCALE = "en";
export const TARGET_LOCALES = ["pt-BR", "es", "zh-Hans"] as const;

export const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
  es: "Español",
  "zh-Hans": "简体中文",
};

/** Replace Intlayer `{token}` placeholders in a resolved leaf value. */
export function fill(text: string, vars?: Record<string, unknown>): string {
  if (!vars) {
    return text;
  }
  let out = text;
  for (const [name, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${name}}`, String(value));
  }
  return out;
}
