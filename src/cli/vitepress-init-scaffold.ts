import fs from "fs";
import path from "path";
import chalk from "chalk";
import { t } from "../i18n/index.js";

const VITEPRESS_CONFIG_REL = "docs/.vitepress/config.mts";
const VITEPRESS_THEME_EN_REL = "docs/.vitepress/i18n/theme.en.json";

const VITEPRESS_CONFIG_TEMPLATE = `import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Keep aligned with \`targetLocales\` in ai-i18n-tools.config.json. */
const TARGET_LOCALES = ["pt-BR", "zh-Hans"] as const;

type ThemeCatalog = {
  site: { title: string; description: string };
  nav: { guide: string };
  sidebar: { guide: string; gettingStarted: string };
  footer: { message: string; copyright: string };
  docFooter: { prev: string; next: string };
  outline: { label: string };
  langMenuLabel: string;
  darkModeSwitchLabel: string;
  darkModeSwitchTitle: string;
  lightModeSwitchTitle: string;
  sidebarMenuLabel: string;
  returnToTopLabel: string;
  skipToContentLabel: string;
  search: { placeholder: string };
};

function loadTheme(localeFile: string): ThemeCatalog {
  const p = path.join(__dirname, "i18n", localeFile);
  return JSON.parse(fs.readFileSync(p, "utf8")) as ThemeCatalog;
}

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? \`/\${localeCode}\` : null;
  return prefixVitepressThemeConfigLinks(
    {
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
    langMenuLabel: t.langMenuLabel,
    darkModeSwitchLabel: t.darkModeSwitchLabel,
    darkModeSwitchTitle: t.darkModeSwitchTitle,
    lightModeSwitchTitle: t.lightModeSwitchTitle,
    sidebarMenuLabel: t.sidebarMenuLabel,
    returnToTopLabel: t.returnToTopLabel,
    skipToContentLabel: t.skipToContentLabel,
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
  const themeFile = \`theme.\${code}.json\`;
  const themePath = path.join(__dirname, "i18n", themeFile);
  const theme = fs.existsSync(themePath) ? loadTheme(themeFile) : enTheme;
  locales[code] = {
    label: localeLabels[code] ?? code,
    lang: code,
    link: \`/\${code}/\`,
    title: theme.site.title,
    description: theme.site.description,
    themeConfig: themeConfigFor(theme, code),
  };
}

export default defineConfig({
  title: enTheme.site.title,
  description: enTheme.site.description,
  locales,
});
`;

const VITEPRESS_THEME_EN_TEMPLATE = {
  site: {
    title: "My Docs",
    description: "Documentation site",
  },
  nav: {
    guide: "Guide",
  },
  sidebar: {
    guide: "Guide",
    gettingStarted: "Getting started",
  },
  footer: {
    message: "Released under the MIT License.",
    copyright: "Copyright © contributors",
  },
  docFooter: {
    prev: "Previous",
    next: "Next",
  },
  outline: {
    label: "On this page",
  },
  langMenuLabel: "Change language",
  darkModeSwitchLabel: "Appearance",
  darkModeSwitchTitle: "Switch to dark theme",
  lightModeSwitchTitle: "Switch to light theme",
  sidebarMenuLabel: "Menu",
  returnToTopLabel: "Return to top",
  skipToContentLabel: "Skip to content",
  search: {
    placeholder: "Search",
  },
};

function writeIfMissing(absPath: string, content: string): boolean {
  if (fs.existsSync(absPath)) {
    return false;
  }
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, "utf8");
  return true;
}

export function scaffoldVitepressInitFiles(cwd = process.cwd()): string[] {
  const written: string[] = [];
  const configAbs = path.join(cwd, VITEPRESS_CONFIG_REL);
  const themeAbs = path.join(cwd, VITEPRESS_THEME_EN_REL);

  if (writeIfMissing(configAbs, VITEPRESS_CONFIG_TEMPLATE)) {
    written.push(VITEPRESS_CONFIG_REL);
  }
  if (writeIfMissing(themeAbs, `${JSON.stringify(VITEPRESS_THEME_EN_TEMPLATE, null, 2)}\n`)) {
    written.push(VITEPRESS_THEME_EN_REL);
  }

  for (const rel of written) {
    console.log(chalk.cyan(t("📄 Wrote VitePress scaffold: {{path}}", { path: rel })));
  }

  return written;
}
