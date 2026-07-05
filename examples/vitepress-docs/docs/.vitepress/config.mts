import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGET_LOCALES = ["pt-BR", "zh-Hans"] as const;

type ThemeCatalog = {
  site: { title: string; description: string };
  nav: { guide: string };
  sidebar: { guide: string; gettingStarted: string };
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

function themeConfigFor(t: ThemeCatalog) {
  return {
    nav: [{ text: t.nav.guide, link: "/guide/getting-started" }],
    sidebar: [
      {
        text: t.sidebar.guide,
        items: [{ text: t.sidebar.gettingStarted, link: "/guide/getting-started" }],
      },
    ],
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
  "pt-BR": "Português (Brasil)",
  "zh-Hans": "简体中文",
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
  ignoreDeadLinks: [/\.\.\/ai-i18n-tools\.config\.json$/, /^http:\/\/localhost/],
  locales,
});
