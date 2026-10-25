import { t, type Dictionary } from "intlayer";

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
      en: "Welcome back, {name}",
      "pt-BR": "Bem-vindo de volta, {name}",
    }),
    alerts: t({
      en: "You have {count} new alerts",
      "pt-BR": "Você tem {count} novos alertas",
    }),
  },
} satisfies Dictionary;
