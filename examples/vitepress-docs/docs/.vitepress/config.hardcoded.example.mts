/**
 * Example VitePress config with inline English theme strings (before loadTheme migration).
 * ai-i18n-tools bootstraps `docs/.vitepress/i18n/theme.en.json` from this shape via
 * `docsOutput.vitepressThemeCatalog` during `translate-docs`.
 */
import { defineConfig } from "vitepress";

export default defineConfig({
  title: "VitePress i18n demo",
  description: "Minimal ai-i18n-tools + VitePress example",
  themeConfig: {
    nav: [{ text: "Guide", link: "/guide/getting-started" }],
    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Getting started", link: "/guide/getting-started" }],
      },
    ],
    footer: {
      message: "MIT-licensed demo.",
      copyright: "Copyright © ai-i18n-tools contributors",
    },
    docFooter: {
      prev: "Previous",
      next: "Next",
    },
    outline: {
      label: "On this page",
    },
    search: {
      provider: "local",
      options: {
        placeholder: "Search",
      },
    },
  },
});
