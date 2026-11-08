import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  Glossary,
  glossaryCacheMissErrors,
  isUiLabelAbbreviation,
} from "../../src/glossary/glossary.js";
import { USER_EDITED_MODEL } from "../../src/core/user-edited-model.js";

function labelMessages(
  g: Glossary,
  source: string,
  translated: string,
  locale: string,
  relPath?: string
): string[] {
  return g.missingLockedUiLabels(source, translated, locale, relPath).map((issue) => issue.message);
}

describe("Glossary", () => {
  it("loads strings.json and finds terms", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a1: { source: "backup", translated: { de: "Sicherung" } },
      }),
      "utf8"
    );
    const g = new Glossary(p, undefined, ["de"]);
    const hints = g.findTermsInText("Use backup today", "de");
    expect(hints.some((h) => h.includes("backup") && h.includes("Sicherung"))).toBe(true);
  });

  it("loads UI glossary from CSV when path is not .json", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-csv-"));
    const uiCsv = path.join(dir, "glossary-ui.csv");
    fs.writeFileSync(
      uiCsv,
      `"en","de"
"widget","Widget"
`,
      "utf8"
    );
    try {
      const g = new Glossary(uiCsv, undefined, ["de"]);
      expect(g.getTranslation("widget", "de")).toBe("Widget");
      expect(g.uiStringsTermCount).toBeGreaterThan(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("findTermsInText skips terms without translation for locale", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-loc-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        t1: { source: "onlyde", translated: { de: "nur" } },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["fr"]);
      const hints = g.findTermsInText("onlyde here", "fr");
      expect(hints).toHaveLength(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips strings.json rows with no translations or empty source", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-skip-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a: { source: "has", translated: {} },
        b: { source: "", translated: { de: "y" } },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["de"]);
      expect(g.size).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("user CSV star rows do nothing when targetLocales is empty", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-star-"));
    const ui = path.join(dir, "ui.json");
    fs.writeFileSync(ui, "{}", "utf8");
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation"
"lonely","*","STAR"
`,
      "utf8"
    );
    try {
      const g = new Glossary(ui, user, []);
      expect(g.getTranslation("lonely", "de")).toBeUndefined();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("findTermsInText requires word boundaries around terms", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-wb-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a1: { source: "cat", translated: { de: "Katze" } },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["de"]);
      expect(g.findTermsInText("scatter", "de")).toHaveLength(0);
      expect(g.findTermsInText("a cat here", "de").length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skipUiAbbreviations omits compact UI label translations from doc hints", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-abbr-"));
    const user = path.join(dir, "glossary-user.csv");
    fs.writeFileSync(
      user,
      [
        "Original language string,locale,Translation,Force",
        "Size,es,Tam,",
        "Storage,es,Alm.,",
        "Duplicati,es,Duplicati,",
        "Homepage,es,Homepage,",
      ].join("\n"),
      "utf8"
    );
    try {
      const g = new Glossary(undefined, user, ["es"]);
      const prose =
        "Optional API keys for Duplicati uploads and Homepage widgets, with upload size and storage limits";
      const uiHints = g.findTermsInText(prose, "es");
      expect(uiHints.some((h) => /Size/i.test(h) && /Tam/i.test(h))).toBe(true);
      expect(uiHints.some((h) => /Storage/i.test(h) && /Alm/i.test(h))).toBe(true);

      const docHints = g.findTermsInText(prose, "es", { skipUiAbbreviations: true });
      expect(docHints.some((h) => /Size/i.test(h) && /Tam/i.test(h))).toBe(false);
      expect(docHints.some((h) => /Storage/i.test(h))).toBe(false);
      expect(docHints.some((h) => /Duplicati/i.test(h))).toBe(true);
      expect(docHints.some((h) => /Homepage/i.test(h))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("isUiLabelAbbreviation detects trailing-dot and short compressions", () => {
    expect(isUiLabelAbbreviation("Size", "Tam")).toBe(true);
    expect(isUiLabelAbbreviation("Storage", "Alm.")).toBe(true);
    expect(isUiLabelAbbreviation("Last", "Últ.")).toBe(true);
    expect(isUiLabelAbbreviation("Size", "Tamaño")).toBe(false);
    expect(isUiLabelAbbreviation("Yes", "Sí")).toBe(false);
    expect(isUiLabelAbbreviation("Duplicati", "Duplicati")).toBe(false);
    expect(isUiLabelAbbreviation("File Size", "Tamaño de Archivo")).toBe(false);
  });

  it("user CSV Context fills from * then exact locale overwrites", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-ctx-"));
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      [
        "Original language string,locale,Translation,Force,Context",
        "Dashboard,*,Tableau,,The product home",
        "Dashboard,de,Übersicht,,German analytics home",
      ].join("\n"),
      "utf8"
    );
    try {
      const g = new Glossary(undefined, user, ["de", "fr"]);
      expect(g.getContext("Dashboard", "fr")).toBe("The product home");
      expect(g.getContext("Dashboard", "de")).toBe("German analytics home");
      const deHints = g.findTermsInText("Open the Dashboard", "de");
      expect(deHints.some((h) => h.includes("German analytics home"))).toBe(true);
      const frHints = g.findTermsInText("Open the Dashboard", "fr");
      expect(frHints.some((h) => h.includes("The product home"))).toBe(true);
      expect(g.findTermsInText("unrelated text", "de")).toHaveLength(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("user CSV exact locale overrides star", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss2-"));
    const ui = path.join(dir, "ui.json");
    fs.writeFileSync(ui, "{}", "utf8");
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation"
"term","*","STAR"
"term","de","EXACT"
`,
      "utf8"
    );
    const g = new Glossary(ui, user, ["de", "fr"]);
    expect(g.getTranslation("term", "de")).toBe("EXACT");
    expect(g.getTranslation("term", "fr")).toBe("STAR");
  });

  it("user CSV force merges per locale (exact overrides star)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-force-"));
    const ui = path.join(dir, "ui.json");
    fs.writeFileSync(ui, "{}", "utf8");
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation","Force"
"t","*","S","true"
"t","de","E","false"
`,
      "utf8"
    );
    try {
      const g = new Glossary(ui, user, ["de", "fr"]);
      expect(g.getForcedTermEntriesForLocale("de")).toEqual([]);
      const frForced = g.getForcedTermEntriesForLocale("fr");
      expect(frForced.length).toBe(1);
      expect(frForced[0]!.replacement).toBe("S");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("seeds a shared UI prefix and locks that label in markdown", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-prefix-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a: {
          source: "Cursor Models run out",
          translated: {
            de: "Cursor-Modelle sind aufgebraucht",
            es: "Se agotan los modelos de Cursor",
          },
        },
        b: {
          source: "Cursor Models at renewal",
          translated: {
            de: "Cursor-Modelle bei Verlängerung",
            es: "Al renovar, modelos de Cursor",
          },
        },
        c: { source: "Other Models", translated: { de: "Andere Modelle" } },
        d: { source: "Save", translated: { de: "Speichern" } },
        e: {
          source: "This file is not a Cursor Pace backup.",
          translated: { de: "Diese Datei ist kein Cursor Pace Backup." },
        },
        f: { source: "Cursor Pace", translated: { de: "Cursor Pace", es: "Ritmo del Cursor" } },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["de", "es"]);
      expect(g.getTranslation("Cursor Models", "de")).toBe("Cursor-Modelle");
      expect(g.getTranslation("Cursor Models", "es")).toBeUndefined();
      const prefixHint = g.findTermsInText("The chart shows Cursor Models today", "de");
      expect(prefixHint.some((hint) => hint.includes("Cursor-Modelle"))).toBe(true);
      const longer = g.findTermsInText("Cursor Models run out today", "de");
      expect(longer.some((hint) => hint.includes("Cursor Models run out"))).toBe(true);
      expect(longer.some((hint) => hint.includes('"Cursor Models"'))).toBe(false);

      expect(labelMessages(g, "See Other Models here", "Siehe Other Models hier", "de")).toEqual(
        []
      );
      expect(
        labelMessages(g, "See **Other Models** here", "Siehe Other Models hier", "de")
      ).toEqual(['Glossary label missing: "Other Models" should include "Andere Modelle"']);
      expect(labelMessages(g, "See Other Models here", "Siehe Andere Modelle hier", "de")).toEqual(
        []
      );
      expect(labelMessages(g, "Click Save now", "Klicken Sie auf Speichern", "de")).toEqual([]);
      expect(
        labelMessages(
          g,
          "This file is not a Cursor Pace backup.",
          "Diese Datei ist keine Sicherung.",
          "de"
        )
      ).toEqual([]);
      expect(labelMessages(g, "Cursor Pace", "Cursor Pace", "de")).toEqual([]);
      expect(labelMessages(g, "Cursor Pace", "Cursor Pace", "es")).toEqual([
        'Glossary label missing: "Cursor Pace" should include "Ritmo del Cursor"',
      ]);
      expect(labelMessages(g, "The Cursor Models series", "Die Serie", "de")).toEqual([]);
      expect(labelMessages(g, "The **Cursor Models** series", "Die Serie", "de")).toEqual([
        'Glossary label missing: "Cursor Models" should include "Cursor-Modelle"',
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not seed sentence stems or placeholder fragments", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-stem-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a: {
          source: "Could not read the file.",
          translated: { fr: "Impossible de lire le fichier." },
        },
        b: {
          source: "Could not sync with the server.",
          translated: { fr: "Impossible de synchroniser avec le serveur." },
        },
        c: {
          source: "There is no cycle data to export.",
          translated: { fr: "Il n'y a pas de données de cycle à exporter." },
        },
        d: {
          source: "There is no usage data to export.",
          translated: { fr: "Il n'y a pas de données d'utilisation à exporter." },
        },
        e: {
          source: "Other models: {0} left",
          translated: { "pt-BR": "Outros modelos: {0} restantes" },
        },
        f: {
          source: "Other models: {0} used",
          translated: { "pt-BR": "Outros modelos: {0} usados" },
        },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["fr", "pt-BR"]);
      expect(g.getTranslation("Could not", "fr")).toBeUndefined();
      expect(g.getTranslation("There is", "fr")).toBeUndefined();
      expect(g.getTranslation("There is no", "fr")).toBeUndefined();
      expect(g.getTranslation("Other models:", "pt-BR")).toBeUndefined();
      expect(g.findTermsInText("the module could not be found", "fr")).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("locks a cited UI label and ignores capitalization", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-cite-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a: { source: "Sign in", translated: { de: "Anmelden", fr: "Se connecter" } },
        b: { source: "Expected usage", translated: { "pt-BR": "Uso esperado" } },
        c: { source: "Cycle start", translated: { fr: "Début du cycle" } },
        d: {
          source: "Sign in to Cursor",
          translated: { fr: "Se connecter à Cursor" },
        },
        e: { source: "Cursor account", translated: { hi: "कर्सर खाता" } },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["de", "fr", "pt-BR"]);
      expect(
        labelMessages(
          g,
          "You can sign in later from Settings.",
          "Sie können sich später anmelden.",
          "de"
        )
      ).toEqual([]);
      expect(
        labelMessages(g, "You can sign in later.", "Vous pouvez vous connecter plus tard.", "fr")
      ).toEqual([]);
      expect(
        labelMessages(g, "Click **Sign in** to continue.", "Klicken Sie auf Login.", "de")
      ).toEqual([]);
      expect(
        labelMessages(
          g,
          "self-contained. **Sign in** also needs the runtime.",
          "autonome. La **connexion** nécessite le runtime.",
          "fr"
        )
      ).toEqual([]);
      expect(
        labelMessages(
          g,
          "Desktop app. Sign in with your Cursor account.",
          "Connectez-vous avec votre compte Cursor.",
          "fr"
        )
      ).toEqual([]);
      expect(
        labelMessages(g, "5. Sign in to Cursor.", "5. Connectez-vous à Cursor.", "fr")
      ).toEqual([]);
      expect(
        labelMessages(
          g,
          "- Sign in to Cursor and refresh usage",
          "- Connectez-vous à Cursor et actualisez",
          "fr"
        )
      ).toEqual([]);
      expect(
        labelMessages(g, "Then open Sign in to Cursor from the menu.", "Puis ouvrez le menu.", "fr")
      ).toEqual([]);
      expect(
        labelMessages(
          g,
          "Sign in with your Cursor account to pull usage.",
          "उपयोग खींचने के लिए अपने कर्सर खाते से साइन इन करें।",
          "hi"
        )
      ).toEqual([]);
      expect(labelMessages(g, "Open **Cursor account**.", "खाता खोलें।", "hi")).toEqual([
        'Glossary label missing: "Cursor account" should include "कर्सर खाता"',
      ]);
      expect(
        labelMessages(
          g,
          "- **Expected usage** on the chart",
          "- O **uso esperado** no gráfico",
          "pt-BR"
        )
      ).toEqual([]);
      expect(
        labelMessages(
          g,
          "The start stays at the cycle start.",
          "Le début reste au début de cycle.",
          "fr"
        )
      ).toEqual([]);
      expect(labelMessages(g, "Open Sign in from the menu.", "Ouvrez le menu.", "fr")).toEqual([]);
      expect(
        labelMessages(g, "See **Expected usage** on the chart.", "Veja o gráfico.", "pt-BR")
      ).toEqual(['Glossary label missing: "Expected usage" should include "Uso esperado"']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not lock a multi-word hint that exists only in the user CSV", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-user-label-"));
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation","Force"
"Other Models","de","Andere Modelle","false"
`,
      "utf8"
    );
    try {
      const g = new Glossary(undefined, user, ["de"]);
      expect(labelMessages(g, "Other Models", "Other Models", "de")).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("user CSV replaces a seeded prefix translation", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-prefix-user-"));
    const ui = path.join(dir, "strings.json");
    fs.writeFileSync(
      ui,
      JSON.stringify({
        a: { source: "Cursor Models run out", translated: { de: "Cursor-Modelle sind leer" } },
        b: {
          source: "Cursor Models at renewal",
          translated: { de: "Cursor-Modelle bei Erneuerung" },
        },
      }),
      "utf8"
    );
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation","Force"
"Cursor Models","de","Cursor Modelle","false"
`,
      "utf8"
    );
    try {
      const g = new Glossary(ui, user, ["de"]);
      expect(g.getTranslation("Cursor Models", "de")).toBe("Cursor Modelle");
      expect(labelMessages(g, "Cursor Models", "Cursor-Modelle", "de")).toEqual([
        'Glossary label missing: "Cursor Models" should include "Cursor Modelle"',
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("misses cache only for segments that contain a forced term", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-force-cache-"));
    const ui = path.join(dir, "strings.json");
    fs.writeFileSync(
      ui,
      JSON.stringify({
        a: { source: "Other Models", translated: { de: "Andere Modelle" } },
        b: { source: "Sign in", translated: { de: "Anmelden" } },
      }),
      "utf8"
    );
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation","Force"
"Other Models","de","Andere Modelle","true"
`,
      "utf8"
    );
    try {
      const g = new Glossary(ui, user, ["de"]);
      const stale = "Die **Other Models** Linie";
      const fresh = "Die **Andere Modelle** Linie";
      const unrelated = "Bitte anmelden";
      expect(g.missingForcedTranslations(stale, "Die **Other Models** Linie", "de")).toEqual([
        'Forced glossary term missing: "Other Models" should include "Andere Modelle"',
      ]);
      expect(g.missingForcedTranslations(fresh, fresh, "de")).toEqual([]);
      expect(g.sourceHasForcedTerm(unrelated, "de")).toBe(false);
      expect(g.missingForcedTranslations(unrelated, unrelated, "de")).toEqual([]);
      expect(glossaryCacheMissErrors(g, "de", unrelated, unrelated, null, true)).toEqual([]);
      expect(glossaryCacheMissErrors(g, "de", stale, stale, null, false)).toEqual([
        'Forced glossary term missing: "Other Models" should include "Andere Modelle"',
      ]);
      expect(glossaryCacheMissErrors(g, "de", stale, stale, USER_EDITED_MODEL, true)).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not lock a glossary term inside a longer bold phrase", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-phrase-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a: { source: "Target language", translated: { uk: "Цільова мова" } },
        b: { source: "No data", translated: { pl: "Brak danych" } },
        c: { source: "Detect Language", translated: { "zh-Hant": "偵測語言" } },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["uk", "pl", "zh-Hant"]);
      const source = "- **Ask for target language** — adds a language selector";
      const translated = "- **Запитати цільову мову** — додає селектор мови";
      expect(labelMessages(g, source, translated, "uk")).toEqual([]);
      expect(labelMessages(g, "**Target language**", "**Мова**", "uk")).toEqual([
        'Glossary label missing: "Target language" should include "Цільова мова"',
      ]);
      expect(labelMessages(g, "**Target language**", "**Цільову мову**", "uk")).toEqual([
        'Glossary label missing: "Target language" should include "Цільова мова"',
      ]);
      const heading = "## Dashboard shows no data for other users (web)";
      expect(
        labelMessages(
          g,
          heading,
          "## Panel pokazuje brak danych dla innych użytkowników (web)",
          "pl"
        )
      ).toEqual([]);
      expect(labelMessages(g, heading, "## Panel nie ma informacji", "pl")).toEqual([
        'Glossary label missing: "No data" should include "Brak danych"',
      ]);
      expect(labelMessages(g, "or **Detect Language**.", "或**偵測語言**。", "zh-Hant")).toEqual(
        []
      );
      expect(labelMessages(g, "or **Detect Language**.", "或**其他**。", "zh-Hant")).toEqual([
        'Glossary label missing: "Detect Language" should include "偵測語言"',
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips a locked label check for a term, locale, and file glob", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-skip-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        a: { source: "Target language", translated: { uk: "Цільова мова", pl: "Język docelowy" } },
      }),
      "utf8"
    );
    try {
      const g = new Glossary(p, undefined, ["uk", "pl"], {
        labelCheckSkips: [
          {
            term: "Target language",
            locales: ["uk"],
            files: ["website/src/content/docs/docs/transform.md"],
          },
        ],
      });
      const source = "**Target language**";
      const translated = "**Мова**";
      expect(
        labelMessages(g, source, translated, "uk", "website/src/content/docs/docs/transform.md")
      ).toEqual([]);
      expect(
        labelMessages(g, source, translated, "uk", "website/src/content/docs/docs/other.md")
      ).toEqual(['Glossary label missing: "Target language" should include "Цільова мова"']);
      expect(labelMessages(g, source, "**Inny**", "pl")).toEqual([
        'Glossary label missing: "Target language" should include "Język docelowy"',
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("wraps CSV parse errors with the filename", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-gloss-bad-csv-"));
    const user = path.join(dir, "glossary-user.csv");
    fs.writeFileSync(user, '"broken', "utf8");
    try {
      expect(() => new Glossary(undefined, user, ["de"])).toThrow(/glossary-user\.csv:/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
