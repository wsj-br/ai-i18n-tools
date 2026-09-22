import { t, type Dictionary } from "intlayer";

export default {
  key: "dashboard",
  content: {
    heading: t({
      en: "Overview",
      de: "Übersicht",
      fr: "Aperçu",
      es: "Resumen",
      "pt-BR": "Visão geral",
    }),
    servers: t({
      en: "Servers",
      de: "Server",
      fr: "Serveurs",
      es: "Servidores",
      "pt-BR": "Servidores",
    }),
    lastRefresh: t({
      en: "Last refresh",
      de: "Letzte Aktualisierung",
      fr: "Dernière actualisation",
      es: "Última actualización",
      "pt-BR": "Última atualização",
    }),
  },
} satisfies Dictionary;
