import fs from "fs";
import os from "os";
import path from "path";
import { Glossary } from "../../src/glossary/glossary.js";
import { GlossaryMatcher } from "../../src/glossary/matcher.js";

describe("GlossaryMatcher", () => {
  it("delegates findTermsInText to the underlying Glossary", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gloss-match-"));
    const p = path.join(dir, "strings.json");
    fs.writeFileSync(
      p,
      JSON.stringify({
        k1: { source: "alpha", translated: { de: "Alpha" } },
      }),
      "utf8"
    );
    try {
      const glossary = new Glossary(p, undefined, ["de"]);
      const matcher = new GlossaryMatcher(glossary);
      const text = "The alpha version.";
      expect(matcher.findTermsInText(text, "de")).toEqual(glossary.findTermsInText(text, "de"));
      expect(matcher.findTermsInText(text, "de").length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
