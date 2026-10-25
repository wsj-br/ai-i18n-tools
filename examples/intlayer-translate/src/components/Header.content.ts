import { insert, t, type Dictionary } from "intlayer";

// Co-located next to Header.tsx, which consumes it via useIntlayer("app").
export default {
  key: "app",
  content: {
    title: t({
      en: "Fleet console",
      "pt-BR": "Console da frota",
      "zh-Hans": "舰队控制台",
      es: "Consola de flota",
    }),
    subtitle: t({
      en: "Monitor every server from one place",
      "pt-BR": "Monitore todos os servidores em um só lugar",
      "zh-Hans": "在一个地方监控所有服务器",
      es: "Supervise cada servidor desde un solo lugar",
    }),
    greeting: t({
      en: insert("Welcome back, {{name}}"),
      "pt-BR": insert("Bem-vindo de volta, {{name}}"),
      "zh-Hans": insert("欢迎回来，{{name}}"),
      es: insert("Bienvenido de nuevo, {{name}}"),
    }),
    alerts: t({
      en: insert("You have {{count}} new alerts"),
      "pt-BR": insert("Você tem {{count}} novos alertas"),
      "zh-Hans": insert("您有 {{count}} 条新警报"),
      es: insert("Tiene {{count}} alertas nuevas"),
    }),
  },
} satisfies Dictionary;
