import { describe, expect, it, vi } from "vitest";
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  getTextDirection,
  applyDirection,
  type I18nWithResources,
} from "../../src/runtime/i18next-helpers.js";

// ---------------------------------------------------------------------------
// Minimal fake i18n instance used across tests
// ---------------------------------------------------------------------------

function makeFakeI18n(translations: Record<string, string> = {}) {
  return {
    t(key: string, _options?: unknown): string {
      const found = translations[key];
      if (found !== undefined) return found;
      // Simulate parseMissingKeyHandler: (key) => key (key-as-default behaviour)
      return key;
    },
  };
}

// ---------------------------------------------------------------------------
// wrapI18nWithKeyTrim - key trimming
// ---------------------------------------------------------------------------

describe("wrapI18nWithKeyTrim – key trimming", () => {
  it("trims leading/trailing spaces from the key before lookup", () => {
    const i18n = makeFakeI18n({ Hello: "Hola" });
    wrapI18nWithKeyTrim(i18n);
    expect(i18n.t("  Hello  ")).toBe("Hola");
  });

  it("passes non-string keys through unchanged", () => {
    const i18n = makeFakeI18n();
    wrapI18nWithKeyTrim(i18n);
    // @ts-expect-error - deliberately passing non-string to test runtime path
    expect(i18n.t(42)).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// wrapI18nWithKeyTrim - source-locale interpolation fallback
// ---------------------------------------------------------------------------

describe("wrapI18nWithKeyTrim – source-locale interpolation fallback", () => {
  it("interpolates {{var}} when no translation is found (key-as-default)", () => {
    const i18n = makeFakeI18n();
    wrapI18nWithKeyTrim(i18n);
    expect(i18n.t("Hello {{name}}", { name: "Ada" })).toBe("Hello Ada");
  });

  it("interpolates numeric values", () => {
    const i18n = makeFakeI18n();
    wrapI18nWithKeyTrim(i18n);
    expect(i18n.t("Count: {{n}}", { n: 7 })).toBe("Count: 7");
  });

  it("does NOT interpolate when a real translation exists", () => {
    // If a translation is found the result !== key, so interpolation is skipped
    // and i18next's own interpolation (already applied before returning) is used.
    const i18n = makeFakeI18n({ "Hello {{name}}": "Hola {{name}} (translated)" });
    wrapI18nWithKeyTrim(i18n);
    // The fake doesn't do interpolation itself - real i18next would. We just assert
    // that wrapI18nWithKeyTrim does NOT double-interpolate when a translation exists.
    expect(i18n.t("Hello {{name}}", { name: "Ada" })).toBe("Hola {{name}} (translated)");
  });

  it("does NOT interpolate when options is a string (count/context shorthand)", () => {
    const i18n = makeFakeI18n();
    wrapI18nWithKeyTrim(i18n);
    expect(i18n.t("Just a key", "some-string-option")).toBe("Just a key");
  });

  it("does NOT interpolate when options is null", () => {
    const i18n = makeFakeI18n();
    wrapI18nWithKeyTrim(i18n);
    expect(i18n.t("Just a key", null as never)).toBe("Just a key");
  });

  it("does NOT interpolate when options is an array", () => {
    const i18n = makeFakeI18n();
    wrapI18nWithKeyTrim(i18n);
    expect(i18n.t("Just a key", [] as never)).toBe("Just a key");
  });

  it("trims key AND interpolates in the same call", () => {
    const i18n = makeFakeI18n();
    wrapI18nWithKeyTrim(i18n);
    expect(i18n.t("  Hello {{name}}  ", { name: "World" })).toBe("Hello World");
  });
});

// ---------------------------------------------------------------------------
// defaultI18nInitOptions
// ---------------------------------------------------------------------------

describe("defaultI18nInitOptions", () => {
  it("uses the supplied locale for lng and fallbackLng", () => {
    const opts = defaultI18nInitOptions("pt-BR");
    expect(opts.lng).toBe("pt-BR");
    expect(opts.fallbackLng).toBe("pt-BR");
  });

  it("defaults to 'en' when no locale is provided", () => {
    const opts = defaultI18nInitOptions();
    expect(opts.lng).toBe("en");
  });

  it("parseMissingKeyHandler returns the key itself", () => {
    const opts = defaultI18nInitOptions("en-GB");
    expect(opts.parseMissingKeyHandler("My label")).toBe("My label");
  });

  it("disables namespace separator", () => {
    expect(defaultI18nInitOptions().nsSeparator).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getTextDirection
// ---------------------------------------------------------------------------

describe("getTextDirection", () => {
  it("returns rtl for Arabic", () => {
    expect(getTextDirection("ar")).toBe("rtl");
    expect(getTextDirection("ar-SA")).toBe("rtl");
  });

  it("returns ltr for English", () => {
    expect(getTextDirection("en")).toBe("ltr");
    expect(getTextDirection("en-GB")).toBe("ltr");
  });

  it("returns ltr for empty string", () => {
    expect(getTextDirection("")).toBe("ltr");
  });
});

// ---------------------------------------------------------------------------
// applyDirection
// ---------------------------------------------------------------------------

describe("applyDirection", () => {
  it("sets dir=rtl on the provided element for an RTL locale", () => {
    const el = { setAttribute: vi.fn() };
    applyDirection("ar", el);
    expect(el.setAttribute).toHaveBeenCalledWith("dir", "rtl");
  });

  it("sets dir=ltr on the provided element for an LTR locale", () => {
    const el = { setAttribute: vi.fn() };
    applyDirection("en", el);
    expect(el.setAttribute).toHaveBeenCalledWith("dir", "ltr");
  });

  it("sets dir on global document.documentElement when element is omitted", () => {
    const setAttribute = vi.fn();
    const prev = (globalThis as { document?: unknown }).document;
    (globalThis as { document?: unknown }).document = {
      documentElement: { setAttribute },
    };
    try {
      applyDirection("ar");
      expect(setAttribute).toHaveBeenCalledWith("dir", "rtl");
    } finally {
      if (prev === undefined) {
        delete (globalThis as { document?: unknown }).document;
      } else {
        (globalThis as { document?: unknown }).document = prev;
      }
    }
  });
});

// ---------------------------------------------------------------------------
// makeLoadLocale
// ---------------------------------------------------------------------------

describe("makeLoadLocale", () => {
  function makeI18nWithResources() {
    const bundles: Record<string, Record<string, string>> = {};
    return {
      t: (key: string) => key,
      addResourceBundle(lng: string, _ns: string, resources: Record<string, string>) {
        bundles[lng] = resources;
      },
      bundles,
    } as unknown as I18nWithResources & { bundles: Record<string, Record<string, string>> };
  }

  it("loads a locale and adds the resource bundle", async () => {
    const i18n = makeI18nWithResources();
    const loader = vi.fn().mockResolvedValue({ Hello: "Hola" });
    const loadLocale = makeLoadLocale(i18n, { es: loader }, "en");
    await loadLocale("es");
    expect(loader).toHaveBeenCalledTimes(1);
    expect((i18n as ReturnType<typeof makeI18nWithResources>).bundles["es"]).toEqual({
      Hello: "Hola",
    });
  });

  it("skips the source locale without calling the loader", async () => {
    const i18n = makeI18nWithResources();
    const loader = vi.fn();
    const loadLocale = makeLoadLocale(i18n, { "en-GB": loader }, "en-GB");
    await loadLocale("en-GB");
    expect(loader).not.toHaveBeenCalled();
  });

  it("warns and skips unsupported locales", async () => {
    const i18n = makeI18nWithResources();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loadLocale = makeLoadLocale(i18n, {}, "en");
    await loadLocale("ja");
    expect(warn).toHaveBeenCalledWith("[i18n] locale not supported:", "ja");
    warn.mockRestore();
  });

  it("handles ESM default-export shaped modules", async () => {
    const i18n = makeI18nWithResources();
    const loader = vi.fn().mockResolvedValue({ default: { Hello: "Bonjour" } });
    const loadLocale = makeLoadLocale(i18n, { fr: loader }, "en");
    await loadLocale("fr");
    expect((i18n as ReturnType<typeof makeI18nWithResources>).bundles["fr"]).toEqual({
      Hello: "Bonjour",
    });
  });

  it("warns when dynamic import fails", async () => {
    const i18n = makeI18nWithResources();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loader = vi.fn().mockRejectedValue(new Error("network"));
    const loadLocale = makeLoadLocale(i18n, { de: loader }, "en");
    await loadLocale("de");
    expect(warn).toHaveBeenCalledWith("[i18n] locale not found:", "de", "network");
    warn.mockRestore();
  });
});
