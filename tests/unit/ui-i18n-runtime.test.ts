import { describe, expect, it, beforeEach } from "vitest";
import { initUiI18n, t, getUiLocale, UI_SOURCE_LOCALE } from "../../src/i18n/index.js";

describe("self-i18n runtime t()", () => {
  beforeEach(() => {
    // No shipped bundle is loaded in tests; the source locale yields identity translations.
    initUiI18n(UI_SOURCE_LOCALE);
  });

  it("returns the source string when no translation is available", () => {
    expect(t("Save")).toBe("Save");
  });

  it("interpolates {{name}} placeholders", () => {
    expect(t("Translated {{count}} of {{total}}", { count: 3, total: 10 })).toBe(
      "Translated 3 of 10"
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(t("Hello {{missing}}", { other: "x" })).toBe("Hello {{missing}}");
  });

  it("tolerates whitespace inside placeholders", () => {
    expect(t("Port {{ port }}", { port: 8675 })).toBe("Port 8675");
  });

  it("tracks the active locale and loads its shipped bundle", () => {
    initUiI18n("de");
    expect(getUiLocale()).toBe("de");
    // The shipped de.json bundle is loaded, so known source text is translated...
    expect(t("Save")).toBe("Speichern");
    // ...while source text with no entry falls back unchanged.
    expect(t("No such UI string exists")).toBe("No such UI string exists");
  });
});
