import { t, type Dictionary } from "intlayer";

export default {
  key: "dynamic-key",
  content: {
    ok: t({
      en: "Healthy",
      de: "Gesund",
      fr: "Sain",
      es: "Correcto",
      "pt-BR": "Saudável",
    }),
    warn: t({
      en: "Degraded",
      de: "Eingeschränkt",
      fr: "Dégradé",
      es: "Degradado",
      "pt-BR": "Degradado",
    }),
    fail: t({
      en: "Down",
      de: "Ausgefallen",
      fr: "Hors service",
      es: "Caído",
      "pt-BR": "Fora",
    }),
  },
} satisfies Dictionary;
