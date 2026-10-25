import { insert, t, type Dictionary } from "intlayer";

// Co-located next to Header.tsx, which consumes it via useIntlayer("app").
export default {
  key: "app",
  content: {
    title: t({
      en: "Fleet console",
      "pt-BR": "Console da frota",
    }),
    subtitle: t({
      en: "Monitor every server from one place",
      "pt-BR": "Monitore todos os servidores em um só lugar",
    }),
    greeting: t({
      en: insert("Welcome back, {{name}}"),
      "pt-BR": insert("Bem-vindo de volta, {{name}}"),
    }),
    alerts: t({
      en: insert("You have {{count}} new alerts"),
      "pt-BR": insert("Você tem {{count}} novos alertas"),
    }),
  },
} satisfies Dictionary;
