import { describe, expect, it } from "vitest";
import {
  extractCatalogReferencesFromConfig,
  findUnusedVitepressCatalogKeys,
  listCatalogStringLeafPaths,
} from "../../src/cli/vitepress-catalog-usage.js";

describe("vitepress catalog usage", () => {
  it("lists string leaf paths from nested catalog JSON", () => {
    expect(
      listCatalogStringLeafPaths({
        site: { title: "Site", description: "Desc" },
        langMenuLabel: "Language",
      })
    ).toEqual(["site.title", "site.description", "langMenuLabel"]);
  });

  it("extracts member-access paths from themeConfigFor", () => {
    const src = `function themeConfigFor(t) {
  return {
    footer: { message: t.footer.message },
    langMenuLabel: t.langMenuLabel,
  };
}
const enTheme = loadTheme("theme.en.json");
const title = enTheme.site.title;
`;
    const refs = extractCatalogReferencesFromConfig(src, "config.mts");
    expect(refs).toEqual(new Set(["footer.message", "langMenuLabel", "site.title"]));
  });

  it("reports catalog keys not referenced in config", () => {
    const catalog = {
      footer: { message: "MIT" },
      langMenuLabel: "Language",
    };
    const config = `function themeConfigFor(t) {
  return { footer: { message: t.footer.message } };
}`;
    expect(findUnusedVitepressCatalogKeys(catalog, config, "config.mts")).toEqual([
      "langMenuLabel",
    ]);
  });
});
