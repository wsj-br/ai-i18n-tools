import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGET_LOCALES = [
  "de",
  "es",
  "fr",
  "hi-Latn",
  "ja",
  "ko",
  "pt-BR",
  "zh-Hans",
  "zh-Hant",
] as const;

type ThemeCatalog = {
  site: { title: string; description: string };
  nav: Record<string, string>;
  sidebar: Record<string, string>;
  footer: { message: string; copyright: string };
  docFooter: { prev: string; next: string };
  outline: { label: string };
  langMenuLabel: string;
  search: { placeholder: string };
};

function loadTheme(localeFile: string): ThemeCatalog {
  const p = path.join(__dirname, "i18n", localeFile);
  return JSON.parse(fs.readFileSync(p, "utf8")) as ThemeCatalog;
}

function guideSidebar(t: ThemeCatalog) {
  return [
    {
      text: t.sidebar.guide,
      items: [
        { text: t.sidebar.whatIs, link: "/guide/what-is-ai-i18n-tools" },
        { text: t.sidebar.installation, link: "/guide/installation" },
        { text: t.sidebar.quickStart, link: "/guide/quick-start" },
        {
          text: t.sidebar.translationTypes,
          collapsed: false,
          items: [
            {
              text: t.sidebar.uiStrings,
              collapsed: true,
              link: "/guide/ui-strings/",
              items: [
                { text: "Overview", link: "/guide/ui-strings/" },
                { text: "Plain HTML apps", link: "/guide/ui-strings/plain-html" },
                { text: "Astro website", link: "/guide/ui-strings/astro-website" },
                { text: "Wire i18next", link: "/guide/ui-strings/i18next-runtime" },
                { text: "t() calls & plurals", link: "/guide/ui-strings/t-calls-and-plurals" },
                { text: "Language switcher & RTL", link: "/guide/ui-strings/language-switcher" },
              ],
            },
            {
              text: t.sidebar.documents,
              collapsed: true,
              link: "/guide/documents/",
              items: [
                { text: "Overview", link: "/guide/documents/" },
                { text: "Output layouts", link: "/guide/documents/output-layouts" },
                { text: "Anchor links", link: "/guide/documents/anchor-links" },
                { text: "Link rewriting", link: "/guide/documents/link-rewriting" },
                { text: "Language switcher", link: "/guide/documents/language-switcher" },
                { text: "CLI options", link: "/guide/documents/cli-options" },
                { text: "Troubleshooting", link: "/guide/documents/troubleshooting" },
              ],
            },
            { text: t.sidebar.json, link: "/guide/json" },
          ],
        },
        {
          text: t.sidebar.integrations,
          collapsed: true,
          items: [
            { text: t.sidebar.astro, link: "/guide/astro-integration" },
            { text: t.sidebar.docusaurus, link: "/guide/docusaurus-integration" },
            { text: t.sidebar.vitepress, link: "/guide/vitepress-integration" },
            { text: t.sidebar.nextra, link: "/guide/nextra-integration" },
          ],
        },
        {
          text: t.sidebar.imagesAndScreenshots,
          collapsed: true,
          link: "/guide/images-and-screenshots/",
          items: [
            { text: "Overview", link: "/guide/images-and-screenshots/" },
            { text: "Shared image", link: "/guide/images-and-screenshots/shared-image" },
            {
              text: "Per-locale folder",
              link: "/guide/images-and-screenshots/per-locale-folder",
            },
            {
              text: "Colocated screenshots",
              link: "/guide/images-and-screenshots/colocated-screenshots",
            },
            { text: "Link rewriting", link: "/guide/images-and-screenshots/link-rewriting" },
            {
              text: "Troubleshooting",
              link: "/guide/images-and-screenshots/troubleshooting",
            },
          ],
        },
        {
          text: t.sidebar.svgTranslation,
          collapsed: true,
          link: "/guide/svg-translation/",
          items: [
            { text: "Overview", link: "/guide/svg-translation/" },
            {
              text: "Web app (flat SVG)",
              link: "/guide/svg-translation/translated-svg-web-app",
            },
            {
              text: "Colocated SVG",
              link: "/guide/svg-translation/translated-svg-colocated",
            },
            { text: "Troubleshooting", link: "/guide/svg-translation/troubleshooting" },
          ],
        },
        { text: t.sidebar.providers, link: "/guide/providers-and-models" },
        { text: t.sidebar.runtimeHelpers, link: "/guide/runtime-helpers" },
        {
          text: t.sidebar.dashboard,
          collapsed: true,
          link: "/guide/translation-dashboard/",
          items: [
            { text: "Overview", link: "/guide/translation-dashboard/" },
            {
              text: "Documentation cache",
              link: "/guide/translation-dashboard/documentation-cache",
            },
            {
              text: "UI strings & plurals",
              link: "/guide/translation-dashboard/ui-strings",
            },
            { text: "Glossary", link: "/guide/translation-dashboard/glossary" },
            { text: "Failures", link: "/guide/translation-dashboard/failures" },
            {
              text: "Markdown issues",
              link: "/guide/translation-dashboard/markdown-issues",
            },
            { text: "Statistics", link: "/guide/translation-dashboard/statistics" },
          ],
        },
      ],
    },
    {
      text: t.sidebar.reference,
      items: [
        { text: t.sidebar.configuration, link: "/reference/configuration" },
        { text: t.sidebar.cli, link: "/reference/cli-commands" },
        { text: t.sidebar.architecture, link: "/reference/architecture" },
        { text: t.sidebar.programmaticApi, link: "/reference/programmatic-api" },
        { text: t.sidebar.environment, link: "/reference/environment-variables" },
      ],
    },
    { text: t.sidebar.examples, link: "/examples" },
  ];
}

function themeConfigFor(t: ThemeCatalog) {
  return {
    nav: [
      { text: t.nav.guide, link: "/guide/what-is-ai-i18n-tools", activeMatch: "/guide/" },
      { text: t.nav.reference, link: "/reference/configuration", activeMatch: "/reference/" },
      { text: t.nav.examples, link: "/examples", activeMatch: "/examples" },
      {
        text: t.nav.github,
        link: "https://github.com/wsj-br/ai-i18n-tools",
      },
    ],
    sidebar: guideSidebar(t),
    footer: {
      message: t.footer.message,
      copyright: t.footer.copyright,
    },
    docFooter: {
      prev: t.docFooter.prev,
      next: t.docFooter.next,
    },
    outline: {
      label: t.outline.label,
    },
    search: {
      provider: "local" as const,
      options: {
        placeholder: t.search.placeholder,
      },
    },
  };
}

const enTheme = loadTheme("theme.en.json");

const localeLabels: Record<string, string> = {
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  "hi-Latn": "Hindi (Roman)",
  ja: "日本語",
  ko: "한국어",
  "pt-BR": "Português (Brasil)",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
};

const locales: Record<string, object> = {
  root: {
    label: "English (UK)",
    lang: "en-GB",
    title: enTheme.site.title,
    description: enTheme.site.description,
    themeConfig: themeConfigFor(enTheme),
  },
};

for (const code of TARGET_LOCALES) {
  const themeFile = `theme.${code}.json`;
  const themePath = path.join(__dirname, "i18n", themeFile);
  const theme = fs.existsSync(themePath) ? loadTheme(themeFile) : enTheme;
  locales[code] = {
    label: localeLabels[code] ?? code,
    lang: code,
    link: `/${code}/`,
    title: theme.site.title,
    description: theme.site.description,
    themeConfig: themeConfigFor(theme),
  };
}

export default defineConfig({
  title: enTheme.site.title,
  description: enTheme.site.description,
  base: "/ai-i18n-tools/",
  markdown: {
    languages: ["dotenv", "ini"],
    languageAlias: {
      env: "dotenv",
      gitignore: "ini",
    },
  },
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.message.includes("/* #__PURE__ */")) return;
          warn(warning);
        },
      },
    },
  },
  srcExclude: ["**/ai-i18n-tools-context.md"],
  ignoreDeadLinks: [
    /^https?:\/\//,
    /github\.com/,
    /^\.\.\//,
    /^\.\//,
    /^\/guide\/[a-z0-9-]+---/,
    /^\/guide\/step-/,
    /^\/guide\/using-the-cli/,
    /^\/guide\/recommended-packagejson-scripts/,
    /^\/guide\/marking-html-for-translation/,
    /^\/guide\/astro-website/,
    /^\/guide\/ui-strings$/,
    /^\/guide\/documents$/,
    /^\/guide\/output-layouts/,
    /^\/guide\/cli-reference/,
    /^\/guide\/protectattributes/,
    /^\/reference\/configuration#/,
    /^\/guide\/index$/,
    /^\.\/LICENSE/,
    /^\.\/README/,
    /^\.\/translated-docs\//,
    /^\.\/docs\//,
    /^\.\/examples\//,
    /^\.\/GETTING_STARTED/,
    /^\.\/LOCALE-ASSETS-GUIDE/,
    /^\.\/PACKAGE_OVERVIEW/,
    /^\.\/references\//,
  ],
  locales,
  themeConfig: themeConfigFor(enTheme),
  head: [["link", { rel: "icon", href: "/ai-i18n-tools/favicon.ico" }]],
});
