import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  extractFumadocsUiCatalog,
  mergeFumadocsUiCatalogs,
} from "../../src/extractors/fumadocs-ui-extractor.js";

const fixtureRoot = path.join(process.cwd(), "tests/fixtures/fumadocs-dot");

describe("extractFumadocsUiCatalog", () => {
  it("extracts English overrides from defineTranslations chain", () => {
    const src = fs.readFileSync(path.join(fixtureRoot, "lib/layout.shared.ts"), "utf8");
    const catalog = extractFumadocsUiCatalog(src, "lib/layout.shared.ts");
    expect(catalog["Search(search trigger)"]).toBe("Search docs");
    expect(catalog.displayName).toBe("English");
  });

  it("extracts flat add() map without locale wrapper", () => {
    const src = `import { defineTranslations } from "fumadocs-core/i18n";
export const translations = defineTranslations().add({
  "Hello(label)": "Hello world",
});`;
    const catalog = extractFumadocsUiCatalog(src, "layout.ts");
    expect(catalog["Hello(label)"]).toBe("Hello world");
  });

  it("mergeFumadocsUiCatalogs keeps existing when extraction is empty", () => {
    const existing = { "Search(search trigger)": "Search" };
    expect(mergeFumadocsUiCatalogs(existing, {})).toEqual(existing);
  });
});
