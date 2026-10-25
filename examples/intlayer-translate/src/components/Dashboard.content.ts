import { t, type Dictionary } from "intlayer";

// Co-located next to Dashboard.tsx, which consumes it via useIntlayer("dashboard").
export default {
  key: "dashboard",
  content: {
    heading: t({
      en: "Overview",
      "pt-BR": "Visão geral",
      "zh-Hans": "概览",
      es: "Información general",
    }),
    stats: {
      servers: t({
        en: "Servers",
        "pt-BR": "Servidores",
        "zh-Hans": "服务器",
        es: "Servidores",
      }),
      online: t({
        en: "Online",
        "pt-BR": "Online",
        "zh-Hans": "在线",
        es: "En línea",
      }),
      lastRefresh: t({
        en: "Last refresh",
        "pt-BR": "Última atualização",
        "zh-Hans": "上次刷新",
        es: "Última actualización",
      }),
    },
    actions: {
      refresh: t({
        en: "Refresh",
        "pt-BR": "Atualizar",
        "zh-Hans": "刷新",
        es: "Actualizar",
      }),
      settings: t({
        en: "Settings",
        "pt-BR": "Configurações",
        "zh-Hans": "设置",
        es: "Configuración",
      }),
    },
  },
} satisfies Dictionary;
