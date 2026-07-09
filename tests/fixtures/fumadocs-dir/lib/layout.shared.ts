import { defineI18n } from "fumadocs-core/i18n";
import { uiTranslations } from "fumadocs-ui/i18n";

const i18n = defineI18n({
  defaultLanguage: "en",
  languages: ["en", "pt-BR"],
  parser: "dir",
});

export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .add({
    en: {
      displayName: "English",
      "Search(search trigger)": "Search",
    },
  });
