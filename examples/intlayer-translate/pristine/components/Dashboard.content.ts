import { t, type Dictionary } from "intlayer";

// Co-located next to Dashboard.tsx, which consumes it via useIntlayer("dashboard").
export default {
  key: "dashboard",
  content: {
    heading: t({
      en: "Overview",
      "pt-BR": "Visão geral",
    }),
    stats: {
      servers: t({
        en: "Servers",
        "pt-BR": "Servidores",
      }),
      online: t({
        en: "Online",
        "pt-BR": "Online",
      }),
      lastRefresh: t({
        en: "Last refresh",
        "pt-BR": "Última atualização",
      }),
    },
    actions: {
      refresh: t({
        en: "Refresh",
        "pt-BR": "Atualizar",
      }),
      settings: t({
        en: "Settings",
        "pt-BR": "Configurações",
      }),
    },
  },
} satisfies Dictionary;
