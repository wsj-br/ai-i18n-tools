import { t, type Dictionary } from "intlayer";

export default {
  key: "common",
  content: {
    ui: {
      save: t({
        en: "Save",
        de: "Speichern",
        fr: "Enregistrer",
        es: "Guardar",
        "pt-BR": "Salvar",
      }),
      cancel: t({
        en: "Cancel",
        de: "Abbrechen",
        fr: "Annuler",
        es: "Cancelar",
        "pt-BR": "Cancelar",
      }),
      back: t({
        en: "Back",
        de: "Zurück",
        fr: "Retour",
        es: "Atrás",
        "pt-BR": "Voltar",
      }),
    },
    navigation: {
      dashboard: t({
        en: "Dashboard",
        de: "Dashboard",
        fr: "Tableau de bord",
        es: "Panel",
        "pt-BR": "Painel",
      }),
      helpFor: t({
        en: "Help for {pageName}",
        de: "Hilfe für {pageName}",
        fr: "Aide pour {pageName}",
        es: "Ayuda para {pageName}",
        "pt-BR": "Ajuda para {pageName}",
      }),
    },
  },
} satisfies Dictionary;
