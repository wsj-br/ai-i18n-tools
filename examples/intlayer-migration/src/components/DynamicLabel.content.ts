import { t, type Dictionary } from "intlayer";

// Co-located next to DynamicLabel.tsx, which consumes it via useIntlayer("dynamic-key").
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
