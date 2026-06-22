import { describe, expect, it } from "vitest";
import { resolveUiLocale } from "../../src/core/ui-locale.js";

const AVAILABLE = ["en-GB", "de", "es", "fr", "hi-Latn", "ja", "ko", "pt-BR", "zh-Hans", "zh-Hant"];
const SOURCE = "en-GB";

function resolve(
  overrides: Partial<Parameters<typeof resolveUiLocale>[0]> = {}
): ReturnType<typeof resolveUiLocale> {
  return resolveUiLocale({
    available: AVAILABLE,
    sourceLocale: SOURCE,
    hostLocale: null,
    ...overrides,
  });
}

describe("resolveUiLocale", () => {
  it("exact-matches an available locale", () => {
    const r = resolve({ cliOption: "pt-BR" });
    expect(r.locale).toBe("pt-BR");
    expect(r.matched).toBe("exact");
  });

  it("normalizes casing for exact match (zh-hans -> zh-Hans)", () => {
    expect(resolve({ cliOption: "zh-hans" }).locale).toBe("zh-Hans");
  });

  it("matches a regional variation to the available variant (pt-PT -> pt-BR)", () => {
    const r = resolve({ cliOption: "pt-PT" });
    expect(r.locale).toBe("pt-BR");
    expect(r.matched).toBe("primary");
  });

  it("matches en-US to the source en-GB by primary subtag", () => {
    const r = resolve({ cliOption: "en-US" });
    expect(r.locale).toBe("en-GB");
    expect(r.matched).toBe("primary");
  });

  it("prefers an exact script match among same-language variants", () => {
    expect(resolve({ cliOption: "zh-Hant-HK" }).locale).toBe("zh-Hant");
  });

  it("falls back to the first same-language variant when no script matches", () => {
    // zh with no script subtag (TW is a region) -> first available zh-* in order
    expect(resolve({ cliOption: "zh" }).locale).toBe("zh-Hans");
  });

  it("falls back to sourceLocale for an unavailable language", () => {
    const r = resolve({ cliOption: "ru" });
    expect(r.locale).toBe(SOURCE);
    expect(r.matched).toBe("fallback");
  });

  it("falls back to sourceLocale when nothing is requested", () => {
    expect(resolve().matched).toBe("fallback");
    expect(resolve().locale).toBe(SOURCE);
  });

  it("applies precedence cli > env > config > host", () => {
    expect(
      resolve({ cliOption: "de", env: "es", configOption: "fr", hostLocale: "ja" }).locale
    ).toBe("de");
    expect(resolve({ env: "es", configOption: "fr", hostLocale: "ja" }).locale).toBe("es");
    expect(resolve({ configOption: "fr", hostLocale: "ja" }).locale).toBe("fr");
    expect(resolve({ hostLocale: "ja" }).locale).toBe("ja");
  });

  it("ignores empty/whitespace candidates and uses the next source", () => {
    expect(resolve({ cliOption: "   ", env: "ko" }).locale).toBe("ko");
  });

  it("records the requested raw value", () => {
    expect(resolve({ cliOption: "pt-PT" }).requested).toBe("pt-PT");
  });
});
