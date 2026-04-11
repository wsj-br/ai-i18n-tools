// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "ai-i18n-tools",
  tagline: "Auto-generated i18n for JavaScript and TypeScript projects",
  url: "https://example.com",
  baseUrl: "/",
  organizationName: "ai-i18n-tools",
  projectName: "ai-i18n-tools",
  onBrokenLinks: "throw",
  // Match GH Pages / static hosting link style (see duplistatus documentation site).
  trailingSlash: false,
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "fr", "de", "pt-BR"],
    localeConfigs: {
      en: {
        label: "English",
        direction: "ltr",
        htmlLang: "en-GB",
        // Explicit path so `write-translations` and `i18n/en/` match other locales’ folder layout.
        path: "en",
        calendar: "gregory",
      },
      es: {
        label: "Español",
        direction: "ltr",
        htmlLang: "es-ES",
        calendar: "gregory",
        // Must match `i18n/<path>/` (htmlLang alone would use `es-ES` and skip translations).
        path: "es",
      },
      fr: {
        label: "Français",
        direction: "ltr",
        htmlLang: "fr-FR",
        calendar: "gregory",
        path: "fr",
      },
      de: {
        label: "Deutsch",
        direction: "ltr",
        htmlLang: "de-DE",
        calendar: "gregory",
        path: "de",
      },
      "pt-BR": {
        label: "Português (Brasil)",
        direction: "ltr",
        htmlLang: "pt-BR",
        calendar: "gregory",
      },
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: "docs",
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "ai-i18n-tools",
        items: [
          {
            type: "docSidebar",
            sidebarId: "mainSidebar",
            position: "left",
            label: "Documentation",
          },
          {
            type: "localeDropdown",
            position: "right",
            dropdownItemsBefore: [],
            dropdownItemsAfter: [],
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Copyright © ${new Date().getFullYear()} ai-i18n-tools.`,
      },
    }),
};

module.exports = config;
