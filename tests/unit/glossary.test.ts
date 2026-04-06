import fs from "fs";
import os from "os";
import path from "path";
import { Glossary } from "../../src/glossary/glossary";

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
});
