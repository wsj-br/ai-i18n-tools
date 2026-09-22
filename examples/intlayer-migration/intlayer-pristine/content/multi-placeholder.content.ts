import { t, type Dictionary } from "intlayer";

export default {
  key: "multi-placeholder",
  content: {
    greeting: t({
      en: "Hello {name}, you have {count} alerts",
      de: "Hallo {name}, Sie haben {count} Hinweise",
      fr: "Bonjour {name}, vous avez {count} alertes",
      es: "Hola {name}, tienes {count} alertas",
      "pt-BR": "Olá {name}, você tem {count} alertas",
    }),
  },
} satisfies Dictionary;
