import { t, type Dictionary } from "intlayer";

export default {
  key: "spread-props",
  content: {
    ok: t({
      en: "All checks passed",
      de: "Alle Prüfungen bestanden",
      fr: "Tous les contrôles ont réussi",
      es: "Todas las comprobaciones pasaron",
      "pt-BR": "Todas as verificações passaram",
    }),
    fail: t({
      en: "Checks failed",
      de: "Prüfungen fehlgeschlagen",
      fr: "Contrôles échoués",
      es: "Comprobaciones fallidas",
      "pt-BR": "Verificações falharam",
    }),
  },
} satisfies Dictionary;
