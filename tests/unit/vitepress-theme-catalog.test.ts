import { describe, expect, it } from "vitest";
import {
  extractVitepressThemeCatalog,
  mergeThemeCatalogs,
} from "../../src/extractors/vitepress-theme-extractor.js";

describe("extractVitepressThemeCatalog", () => {
  it("extracts translatable strings from inline defineConfig", () => {
    const src = `import { defineConfig } from "vitepress";
export default defineConfig({
  title: "Site title",
  description: "Site description",
  themeConfig: {
    nav: [{ text: "Guide", link: "/guide/" }],
    footer: { message: "MIT", copyright: "Copyright" },
    search: { provider: "local", options: { placeholder: "Search" } },
  },
});`;
    const catalog = extractVitepressThemeCatalog(src, "config.mts");
    expect(catalog.title).toBe("Site title");
    expect(catalog.description).toBe("Site description");
    expect(catalog).toMatchObject({
      themeConfig: {
        nav: { "0": { text: "Guide" } },
        footer: { message: "MIT", copyright: "Copyright" },
        search: { options: { placeholder: "Search" } },
      },
    });
  });

  it("mergeThemeCatalogs keeps existing when extraction is empty", () => {
    const existing = { site: { title: "Existing" } };
    expect(mergeThemeCatalogs(existing, {})).toEqual(existing);
  });
});
