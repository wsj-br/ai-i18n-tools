import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { Glossary, isUiLabelAbbreviation } from "../../src/glossary/glossary.js";

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
