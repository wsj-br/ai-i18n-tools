import { describe, expect, it, vi } from "vitest";

// A manifest that (a) omits the source locale, (b) marks one locale rtl, and
// (c) contains empty/invalid code rows that must be filtered out. This drives
// the manifest-dependent branches of the self-i18n runtime that the shipped
// (all-ltr, source-included) manifest cannot exercise.
const FAKE_MANIFEST = JSON.stringify([
  { code: "ar", direction: "rtl" },
  { code: "de", direction: "ltr" },
  { code: "" },
  { label: "no code" },
]);

vi.mock("node:fs", () => {
  const readFileSync = vi.fn(() => FAKE_MANIFEST);
  return { default: { readFileSync }, readFileSync };
});

// Imported after the mock is registered; the module's first manifest read (and
// its module-level cache) therefore sees FAKE_MANIFEST.
import {
  availableUiLocales,
  loadUiManifest,
  uiLocaleDirection,
  UI_SOURCE_LOCALE,
} from "../../src/i18n/index.js";

describe("self-i18n with a mocked manifest", () => {
  it("parses a non-source manifest array", () => {
    const rows = loadUiManifest();
    expect(rows.map((r) => r.code)).toContain("ar");
  });

  it("returns rtl for an rtl-marked locale and ltr otherwise", () => {
    expect(uiLocaleDirection("ar")).toBe("rtl");
    expect(uiLocaleDirection("de")).toBe("ltr");
    expect(uiLocaleDirection("not-in-manifest")).toBe("ltr");
  });

  it("prepends the source locale and filters empty/invalid codes", () => {
    const codes = availableUiLocales();
    expect(codes[0]).toBe(UI_SOURCE_LOCALE);
    expect(codes).toContain("ar");
    expect(codes).toContain("de");
    expect(codes).not.toContain("");
  });
});
