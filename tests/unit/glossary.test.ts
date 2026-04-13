import fs from "fs";
import os from "os";
import path from "path";
import { Glossary } from "../../src/glossary/glossary.js";

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
});
