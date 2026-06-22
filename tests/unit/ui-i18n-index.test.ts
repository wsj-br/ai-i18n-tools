import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  UI_LANG_ENV_VAR,
  UI_SOURCE_LOCALE,
  availableUiLocales,
  getUiLocale,
  initUiI18n,
  initUiI18nFrom,
  initUiI18nFromEnvironment,
  loadUiBundle,
  loadUiManifest,
  readUiLangFromArgv,
  resolveUiI18n,
  t,
  uiLocaleDirection,
} from "../../src/i18n/index.js";

describe("self-i18n constants", () => {
  it("exposes the en-GB source locale and AI_I18N_LANG env var", () => {
    expect(UI_SOURCE_LOCALE).toBe("en-GB");
    expect(UI_LANG_ENV_VAR).toBe("AI_I18N_LANG");
  });
});

describe("loadUiManifest", () => {
  it("reads the shipped manifest and includes the source locale row", () => {
    const rows = loadUiManifest();
    expect(rows.length).toBeGreaterThan(0);
    const source = rows.find((r) => r.code === UI_SOURCE_LOCALE);
    expect(source?.isSourceLocale).toBe(true);
  });

  it("caches the parsed manifest (returns the same reference)", () => {
    expect(loadUiManifest()).toBe(loadUiManifest());
  });
});

describe("availableUiLocales", () => {
  it("lists the manifest codes and includes the source locale", () => {
    const codes = availableUiLocales();
    expect(codes).toContain(UI_SOURCE_LOCALE);
    expect(codes).toContain("de");
    expect(codes).toContain("pt-BR");
  });
});

describe("uiLocaleDirection", () => {
  it("defaults to ltr for known and unknown locales", () => {
    expect(uiLocaleDirection("de")).toBe("ltr");
    expect(uiLocaleDirection("does-not-exist")).toBe("ltr");
  });
});

describe("loadUiBundle", () => {
  it("returns {} for the source locale without touching disk", () => {
    expect(loadUiBundle(UI_SOURCE_LOCALE)).toEqual({});
  });

  it("returns {} for an empty locale code", () => {
    expect(loadUiBundle("")).toEqual({});
  });

  it("loads a real shipped bundle keyed by English source text", () => {
    const bundle = loadUiBundle("de");
    expect(bundle["Usage:"]).toBe("Verwendung:");
  });

  it("returns {} for a locale with no shipped bundle", () => {
    expect(loadUiBundle("xx-Missing")).toEqual({});
  });

  it("returns {} when the bundle JSON is invalid", () => {
    const spy = vi.spyOn(fs, "readFileSync").mockReturnValue("} not json {");
    try {
      expect(loadUiBundle("de")).toEqual({});
    } finally {
      spy.mockRestore();
    }
  });

  it("returns {} when the bundle JSON is an array rather than an object", () => {
    const spy = vi.spyOn(fs, "readFileSync").mockReturnValue("[]");
    try {
      expect(loadUiBundle("de")).toEqual({});
    } finally {
      spy.mockRestore();
    }
  });
});

describe("initUiI18n / getUiLocale / t", () => {
  beforeEach(() => {
    initUiI18n(UI_SOURCE_LOCALE);
  });

  it("falls back to the source locale for empty/whitespace input", () => {
    initUiI18n("   ");
    expect(getUiLocale()).toBe(UI_SOURCE_LOCALE);
    initUiI18n(null);
    expect(getUiLocale()).toBe(UI_SOURCE_LOCALE);
    initUiI18n(undefined);
    expect(getUiLocale()).toBe(UI_SOURCE_LOCALE);
  });

  it("trims the requested locale", () => {
    initUiI18n("  de  ");
    expect(getUiLocale()).toBe("de");
  });

  it("uses the loaded bundle for translations and interpolates", () => {
    initUiI18n("de");
    expect(t("Usage:")).toBe("Verwendung:");
    // Unknown source text falls back to the (interpolated) source string.
    expect(t("Definitely not a real key {{x}}", { x: 1 })).toBe("Definitely not a real key 1");
  });
});

describe("readUiLangFromArgv", () => {
  it("reads the --ui-lang <value> form", () => {
    expect(readUiLangFromArgv(["--ui-lang", "de"])).toBe("de");
  });

  it("reads the -L <value> short form", () => {
    expect(readUiLangFromArgv(["-L", "fr"])).toBe("fr");
  });

  it("reads the --ui-lang=<value> form", () => {
    expect(readUiLangFromArgv(["x", "--ui-lang=pt-BR", "y"])).toBe("pt-BR");
  });

  it("reads the -L=<value> form", () => {
    expect(readUiLangFromArgv(["-L=ja"])).toBe("ja");
  });

  it("returns undefined when the flag has no following value", () => {
    expect(readUiLangFromArgv(["--ui-lang"])).toBeUndefined();
  });

  it("returns undefined when the next token looks like another flag", () => {
    expect(readUiLangFromArgv(["--ui-lang", "--verbose"])).toBeUndefined();
  });

  it("returns undefined when the flag is absent", () => {
    expect(readUiLangFromArgv(["translate-docs", "-l", "de"])).toBeUndefined();
  });
});

describe("resolveUiI18n / initUiI18nFrom", () => {
  it("resolves cli over env over config against the shipped manifest", () => {
    expect(resolveUiI18n({ cliOption: "de", env: "fr", configOption: "ja" }).locale).toBe("de");
    expect(resolveUiI18n({ env: "fr", configOption: "ja" }).locale).toBe("fr");
    expect(resolveUiI18n({ configOption: "ja" }).locale).toBe("ja");
  });

  it("falls back to the source locale for an unavailable language", () => {
    const r = resolveUiI18n({ cliOption: "zz" });
    expect(r.locale).toBe(UI_SOURCE_LOCALE);
    expect(r.matched).toBe("fallback");
  });

  it("initUiI18nFrom returns and activates the resolved locale", () => {
    const chosen = initUiI18nFrom({ cliOption: "de" });
    expect(chosen).toBe("de");
    expect(getUiLocale()).toBe("de");
  });
});

describe("initUiI18nFromEnvironment", () => {
  let savedArgv: string[];
  let savedEnv: string | undefined;

  beforeEach(() => {
    savedArgv = process.argv;
    savedEnv = process.env[UI_LANG_ENV_VAR];
  });

  afterEach(() => {
    process.argv = savedArgv;
    if (savedEnv === undefined) {
      delete process.env[UI_LANG_ENV_VAR];
    } else {
      process.env[UI_LANG_ENV_VAR] = savedEnv;
    }
    initUiI18n(UI_SOURCE_LOCALE);
  });

  it("prefers the argv --ui-lang flag over the environment variable", () => {
    process.argv = ["node", "cli", "--ui-lang", "de"];
    process.env[UI_LANG_ENV_VAR] = "fr";
    expect(initUiI18nFromEnvironment()).toBe("de");
    expect(getUiLocale()).toBe("de");
  });

  it("uses the environment variable when no argv flag is present", () => {
    process.argv = ["node", "cli"];
    process.env[UI_LANG_ENV_VAR] = "fr";
    expect(initUiI18nFromEnvironment()).toBe("fr");
  });

  it("uses the config uiLanguage as the lowest-priority candidate", () => {
    process.argv = ["node", "cli"];
    delete process.env[UI_LANG_ENV_VAR];
    expect(initUiI18nFromEnvironment("ja")).toBe("ja");
  });

  it("warns when an unavailable --ui-lang/-L locale falls back to the default", () => {
    process.argv = ["node", "cli", "--ui-lang", "zz-CLI"];
    delete process.env[UI_LANG_ENV_VAR];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(initUiI18nFromEnvironment()).toBe(UI_SOURCE_LOCALE);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain("zz-CLI");
    } finally {
      warn.mockRestore();
    }
  });

  it("warns when an unavailable AI_I18N_LANG locale falls back to the default", () => {
    process.argv = ["node", "cli"];
    process.env[UI_LANG_ENV_VAR] = "zz-ENV";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(initUiI18nFromEnvironment()).toBe(UI_SOURCE_LOCALE);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain("zz-ENV");
    } finally {
      warn.mockRestore();
    }
  });

  it("warns when an unavailable config uiLanguage falls back to the default", () => {
    process.argv = ["node", "cli"];
    delete process.env[UI_LANG_ENV_VAR];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(initUiI18nFromEnvironment("zz-CONFIG")).toBe(UI_SOURCE_LOCALE);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain("zz-CONFIG");
    } finally {
      warn.mockRestore();
    }
  });

  it("does not warn for an available explicitly-requested locale", () => {
    process.argv = ["node", "cli", "--ui-lang", "de"];
    delete process.env[UI_LANG_ENV_VAR];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(initUiI18nFromEnvironment()).toBe("de");
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("warns at most once per requested locale across repeated calls", () => {
    process.argv = ["node", "cli", "--ui-lang", "zz-ONCE"];
    delete process.env[UI_LANG_ENV_VAR];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      initUiI18nFromEnvironment();
      initUiI18nFromEnvironment("zz-ONCE");
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });
});
