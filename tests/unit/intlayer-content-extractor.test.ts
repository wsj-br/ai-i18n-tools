import { describe, expect, it } from "vitest";
import {
  convertIntlayerPlaceholders,
  extractIntlayerContentFile,
  mapIntlayerLocaleToConfig,
  pickIntlayerSourceText,
} from "../../src/extractors/intlayer-content-extractor.js";
import { uiStringHash } from "../../src/extractors/ui-string-locations.js";

const SAMPLE = `
import { t, type Dictionary } from 'intlayer';

export default {
  key: 'common',
  content: {
    ui: {
      save: t({ en: 'Save', de: 'Speichern', fr: 'Enregistrer' }),
    },
    navigation: {
      helpFor: t({ en: 'Help for {pageName}', de: 'Hilfe für {pageName}' }),
    },
    skipMe: 42,
  },
} satisfies Dictionary;
`;

describe("pickIntlayerSourceText", () => {
  it("maps en-GB config source onto an en key", () => {
    const picked = pickIntlayerSourceText({ en: "Save", de: "Speichern" }, "en-GB");
    expect(picked).toEqual({ key: "en", text: "Save" });
  });

  it("prefers an exact BCP-47 match", () => {
    const picked = pickIntlayerSourceText({ en: "Save", "en-GB": "Save (GB)" }, "en-GB");
    expect(picked).toEqual({ key: "en-GB", text: "Save (GB)" });
  });
});

describe("mapIntlayerLocaleToConfig", () => {
  it("returns null for the source locale key", () => {
    expect(mapIntlayerLocaleToConfig("en", "en-GB", ["de", "fr"])).toBeNull();
  });

  it("returns the config target form", () => {
    expect(mapIntlayerLocaleToConfig("pt-br", "en", ["de", "pt-BR"])).toBe("pt-BR");
  });
});

describe("convertIntlayerPlaceholders", () => {
  it("turns {pageName} into {{pageName}} without touching already-converted tokens", () => {
    expect(convertIntlayerPlaceholders("Help for {pageName}", ["pageName"])).toBe(
      "Help for {{pageName}}"
    );
    expect(convertIntlayerPlaceholders("Help for {{pageName}}", ["pageName"])).toBe(
      "Help for {{pageName}}"
    );
  });
});

describe("extractIntlayerContentFile", () => {
  it("extracts nested t() leaves and reports non-t leaves", () => {
    const result = extractIntlayerContentFile(SAMPLE, "content/common.content.ts", "en");
    expect(result.dictKey).toBe("common");
    expect(result.leaves.map((l) => l.dotPath).sort()).toEqual(["navigation.helpFor", "ui.save"]);
    const save = result.leaves.find((l) => l.dotPath === "ui.save")!;
    expect(save.sourceText).toBe("Save");
    expect(save.hash).toBe(uiStringHash("Save"));
    expect(save.locales).toEqual({ en: "Save", de: "Speichern", fr: "Enregistrer" });
    expect(result.unsupported.some((u) => u.reason === "unsupported-leaf")).toBe(true);
  });

  it("accepts a default export without satisfies", () => {
    const src = `export default { key: "hdr", content: { title: t({ en: "Hello" }) } };`;
    const result = extractIntlayerContentFile(src, "h.content.ts", "en");
    expect(result.dictKey).toBe("hdr");
    expect(result.leaves[0]?.sourceText).toBe("Hello");
  });

  it("reports missing source locale", () => {
    const src = `export default { key: "x", content: { a: t({ de: "Nein" }) } };`;
    const result = extractIntlayerContentFile(src, "x.content.ts", "en");
    expect(result.leaves).toEqual([]);
    expect(result.unsupported[0]?.reason).toBe("missing-source-locale");
  });
});
