import { t, type Dictionary } from "intlayer";

export default {
  key: "app-header",
  content: {
    title: t({
      en: "Status console",
      de: "Statuskonsole",
      fr: "Console d'état",
      es: "Consola de estado",
      "pt-BR": "Console de status",
    }),
    subtitle: t({
      en: "Intlayer migration demo",
      de: "Intlayer-Migrationsdemo",
      fr: "Démo de migration Intlayer",
      es: "Demo de migración Intlayer",
      "pt-BR": "Demo de migração Intlayer",
    }),
  },
} satisfies Dictionary;
