export const SOURCE_LOCALE = "en";
export const TARGET_LOCALES = ["de", "fr", "es", "pt-BR"] as const;

const bundles: Record<string, Record<string, string>> = {};
let current = SOURCE_LOCALE;

// Resolved even when src/locales/ does not exist yet (before migrate-intlayer).
const localeModules = import.meta.glob<Record<string, string>>("./locales/*.json", {
  import: "default",
});

export function t(key: string, vars?: Record<string, unknown>): string {
  const bundle = bundles[current] ?? {};
  let out = bundle[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{{${name}}}`, String(value));
    }
  }
  return out;
}

export async function loadLocale(code: string): Promise<void> {
  current = code;
  if (code === SOURCE_LOCALE) {
    return;
  }
  if (bundles[code]) {
    return;
  }
  const load = localeModules[`./locales/${code}.json`];
  if (!load) {
    bundles[code] = {};
    return;
  }
  try {
    bundles[code] = await load();
  } catch {
    bundles[code] = {};
  }
}

export function getLocale(): string {
  return current;
}
