import { describe, expect, it } from "vitest";
import { buildUiXliffString } from "../../src/cli/export-ui-xliff.js";
import type { I18nConfig } from "../../src/core/types.js";

const minimalConfig = {
  sourceLocale: "en-GB",
} as Pick<I18nConfig, "sourceLocale"> as I18nConfig;

describe("buildUiXliffString", () => {
  it("emits XLIFF 2.0 root with srcLang and trgLang", () => {
    const xml = buildUiXliffString(
      minimalConfig,
      { abc12345: { source: "Hello", translated: { de: "Hallo" } } },
      "de",
      false,
      "strings"
    );
    expect(xml).toContain('xmlns="urn:oasis:names:tc:xliff:document:2.0"');
    expect(xml).toContain('srcLang="en-GB"');
    expect(xml).toContain('trgLang="de"');
    expect(xml).toContain('<file id="strings">');
  });

  it("includes target when translated", () => {
    const xml = buildUiXliffString(
      minimalConfig,
      { abc12345: { source: "Hello", translated: { de: "Hallo" } } },
      "de",
      false,
      "strings"
    );
    expect(xml).toContain('<segment state="translated">');
    expect(xml).toContain("<target>Hallo</target>");
  });

  it("omits target when missing translation", () => {
    const xml = buildUiXliffString(
      minimalConfig,
      { abc12345: { source: "Hello" } },
      "de",
      false,
      "strings"
    );
    expect(xml).toContain('<segment state="initial">');
    expect(xml).not.toContain("<target>");
  });

  it("escapes XML in source and target", () => {
    const xml = buildUiXliffString(
      minimalConfig,
      {
        x1: {
          source: "a & b < c",
          translated: { de: 'd "e"' },
        },
      },
      "de",
      false,
      "strings"
    );
    expect(xml).toContain("a &amp; b &lt; c");
    expect(xml).toContain("d &quot;e&quot;");
  });

  it("skips translated units when untranslatedOnly", () => {
    const xml = buildUiXliffString(
      minimalConfig,
      {
        a: { source: "One", translated: { de: "Eins" } },
        b: { source: "Two" },
      },
      "de",
      true,
      "strings"
    );
    expect(xml).not.toContain("One");
    expect(xml).toContain("Two");
    expect(xml).not.toContain("Eins");
  });

  it("writes location notes", () => {
    const xml = buildUiXliffString(
      minimalConfig,
      {
        h: {
          source: "Hi",
          locations: [{ file: "src/x.tsx", line: 10 }],
        },
      },
      "de",
      false,
      "strings"
    );
    expect(xml).toContain('<note category="location">src/x.tsx:10</note>');
  });
});
