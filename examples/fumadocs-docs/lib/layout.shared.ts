import fs from "node:fs";
import path from "node:path";
import { i18n } from "@/lib/i18n";
import { uiTranslations } from "fumadocs-ui/i18n";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function loadUiCatalog(locale: string): Record<string, string> {
  const catalogPath = path.join(process.cwd(), "lib/i18n", `ui.${locale}.json`);
  if (!fs.existsSync(catalogPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(catalogPath, "utf8")) as Record<string, string>;
}

export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .add({
    en: {
      displayName: "English",
      "Search(search trigger)": "Search docs",
    },
  });

export function baseOptions(locale: string): BaseLayoutProps {
  const catalog = loadUiCatalog(locale);
  return {
    nav: {
      title: catalog["site.title"] ?? "Fumadocs example",
    },
  };
}
