import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { prefixVitepressThemeConfigLinks } from "../../src/processors/vitepress-link-normalize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGET_LOCALES = [
  "de",
  "es",
  "fr",
  "hi",
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
        { text: t.sidebar.toolUiLanguage, link: "/guide/tool-ui-language" },
        {
          text: t.sidebar.translationTypes,
          collapsed: false,
          items: [
            {
              text: t.sidebar.uiStrings,
              collapsed: true,
              link: "/guide/ui-strings/",
              items: [
                { text: t.sidebar.overview, link: "/guide/ui-strings/" },
                { text: t.sidebar.uiStringsPlainHtml, link: "/guide/ui-strings/plain-html" },
                { text: t.sidebar.uiStringsAstroWebsite, link: "/guide/ui-strings/astro-website" },
                { text: t.sidebar.uiStringsWireI18next, link: "/guide/ui-strings/i18next-runtime" },
                {
                  text: t.sidebar.uiStringsTCallsAndPlurals,
                  link: "/guide/ui-strings/t-calls-and-plurals",
                },
                {
                  text: t.sidebar.uiStringsLanguageSwitcher,
                  link: "/guide/ui-strings/language-switcher",
                },
              ],
            },
            {
              text: t.sidebar.documents,
              collapsed: true,
              link: "/guide/documents/",
              items: [
                { text: t.sidebar.overview, link: "/guide/documents/" },
                { text: t.sidebar.documentsOutputLayouts, link: "/guide/documents/output-layouts" },
                { text: t.sidebar.documentsAnchorLinks, link: "/guide/documents/anchor-links" },
                { text: t.sidebar.documentsLinkRewriting, link: "/guide/documents/link-rewriting" },
                {
                  text: t.sidebar.documentsLanguageSwitcher,
                  link: "/guide/documents/language-switcher",
                },
                { text: t.sidebar.documentsCliOptions, link: "/guide/documents/cli-options" },
                {
                  text: t.sidebar.documentsTroubleshooting,
                  link: "/guide/documents/troubleshooting",
                },
              ],
            },
            { text: t.sidebar.json, link: "/guide/json" },
          ],
        },
        {
          text: t.sidebar.integrations,
          collapsed: true,
          link: "/guide/integrations/",
          items: [
            { text: t.sidebar.overview, link: "/guide/integrations/" },
            { text: t.sidebar.astro, link: "/guide/integrations/astro" },
            { text: t.sidebar.docusaurus, link: "/guide/integrations/docusaurus" },
            { text: t.sidebar.vitepress, link: "/guide/integrations/vitepress" },
            { text: t.sidebar.nextra, link: "/guide/integrations/nextra" },
            { text: t.sidebar.fumadocs, link: "/guide/integrations/fumadocs" },
          ],
        },
        {
          text: t.sidebar.imagesAndScreenshots,
          collapsed: true,
          link: "/guide/images-and-screenshots/",
          items: [
            { text: t.sidebar.overview, link: "/guide/images-and-screenshots/" },
            { text: t.sidebar.imagesSharedImage, link: "/guide/images-and-screenshots/shared-image" },
            {
              text: t.sidebar.imagesPerLocaleFolder,
              link: "/guide/images-and-screenshots/per-locale-folder",
            },
            {
              text: t.sidebar.imagesColocatedScreenshots,
              link: "/guide/images-and-screenshots/colocated-screenshots",
            },
            {
              text: t.sidebar.imagesLinkRewriting,
              link: "/guide/images-and-screenshots/link-rewriting",
            },
            {
              text: t.sidebar.imagesTroubleshooting,
              link: "/guide/images-and-screenshots/troubleshooting",
            },
          ],
        },
        {
          text: t.sidebar.svgTranslation,
          collapsed: true,
          link: "/guide/svg-translation/",
          items: [
            { text: t.sidebar.overview, link: "/guide/svg-translation/" },
            {
              text: t.sidebar.svgWebAppFlat,
              link: "/guide/svg-translation/translated-svg-web-app",
            },
            {
              text: t.sidebar.svgColocated,
              link: "/guide/svg-translation/translated-svg-colocated",
            },
            { text: t.sidebar.svgTroubleshooting, link: "/guide/svg-translation/troubleshooting" },
          ],
        },
        { text: t.sidebar.providers, link: "/guide/providers-and-models" },
        { text: t.sidebar.runtimeHelpers, link: "/guide/runtime-helpers" },
        {
          text: t.sidebar.dashboard,
          collapsed: true,
          link: "/guide/translation-dashboard/",
          items: [
            { text: t.sidebar.overview, link: "/guide/translation-dashboard/" },
            {
              text: t.sidebar.dashboardDocumentationCache,
              link: "/guide/translation-dashboard/documentation-cache",
            },
            {
              text: t.sidebar.dashboardUiStringsAndPlurals,
              link: "/guide/translation-dashboard/ui-strings",
            },
            { text: t.sidebar.dashboardGlossary, link: "/guide/translation-dashboard/glossary" },
            { text: t.sidebar.dashboardFailures, link: "/guide/translation-dashboard/failures" },
            {
              text: t.sidebar.dashboardMarkdownIssues,
              link: "/guide/translation-dashboard/markdown-issues",
            },
            {
              text: t.sidebar.dashboardStatistics,
              link: "/guide/translation-dashboard/statistics",
            },
          ],
        },
      ],
    },
    { text: t.sidebar.examples, link: "/examples" },
    {
      text: t.sidebar.reference,
      items: [
        { text: t.sidebar.configuration, link: "/reference/configuration" },
        {
          text: t.sidebar.cli,
          collapsed: false,
          items: [
            { text: t.sidebar.cliOverview, link: "/reference/cli-commands/" },
            { text: t.sidebar.cliSetup, link: "/reference/cli-commands/setup" },
            { text: t.sidebar.cliModels, link: "/reference/cli-commands/models" },
            { text: t.sidebar.cliUiStrings, link: "/reference/cli-commands/ui-strings" },
            { text: t.sidebar.cliDocuments, link: "/reference/cli-commands/documents" },
            { text: t.sidebar.cliContent, link: "/reference/cli-commands/content" },
            { text: t.sidebar.cliWorkflows, link: "/reference/cli-commands/workflows" },
            { text: t.sidebar.cliMaintenance, link: "/reference/cli-commands/maintenance" },
            { text: t.sidebar.cliTools, link: "/reference/cli-commands/tools" },
          ],
        },
        { text: t.sidebar.architecture, link: "/reference/architecture" },
        { text: t.sidebar.programmaticApi, link: "/reference/programmatic-api" },
        { text: t.sidebar.environment, link: "/reference/environment-variables" },
      ],
    },
  ];
}

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
    logo: "/ai-i18n-tools_logo.svg",
    nav: [
      { text: t.nav.guide, link: "/guide/what-is-ai-i18n-tools", activeMatch: "/guide/" },
      { text: t.nav.examples, link: "/examples", activeMatch: "/examples" },
      { text: t.nav.reference, link: "/reference/configuration", activeMatch: "/reference/" },
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
    langMenuLabel: t.langMenuLabel,
    search: {
      provider: "local" as const,
      options: {
        placeholder: t.search.placeholder,
      },
    },
    },
    localeRoutePrefix
  );
}

const enTheme = loadTheme("theme.en.json");

const localeLabels: Record<string, string> = {
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
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
    themeConfig: themeConfigFor(theme, code),
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
    /^\/guide\/integrations$/,
    /^\/guide\/astro-integration/,
    /^\/guide\/docusaurus-integration/,
    /^\/guide\/vitepress-integration/,
    /^\/guide\/nextra-integration/,
    /^\/guide\/fumadocs-integration/,
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
