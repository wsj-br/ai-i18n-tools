import { defineTranslations } from "fumadocs-core/i18n";
import { uiTranslations } from "fumadocs-ui/i18n";

export const translations = defineTranslations()
  .extend(uiTranslations())
  .add({
    en: {
      "Search(search trigger)": "Search docs",
      displayName: "English",
    },
  });
