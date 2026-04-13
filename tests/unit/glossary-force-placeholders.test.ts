import fs from "fs";
import os from "os";
import path from "path";
import { Glossary } from "../../src/glossary/glossary.js";
import {
  protectGlossaryForcedTerms,
  restoreGlossaryForcedTerms,
} from "../../src/processors/glossary-force-placeholders.js";

describe("glossary-force-placeholders", () => {
  it("round-trips a single forced term", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gff-"));
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation","Force"
"Brand","*","Brand","true"
`,
      "utf8"
    );
    try {
      const g = new Glossary(undefined, user, ["de"]);
      const { text, replacements } = protectGlossaryForcedTerms(
        "Use Brand today in Brand.",
        g,
        "de"
      );
      expect(text).toContain("{{GLOSSARY_FORCE_");
      expect(replacements).toEqual(["Brand", "Brand"]);
      const back = restoreGlossaryForcedTerms(text, replacements);
      expect(back).toBe("Use Brand today in Brand.");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not match substring without word boundaries", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gff-wb-"));
    const user = path.join(dir, "user.csv");
    fs.writeFileSync(
      user,
      `"Original language string","locale","Translation","Force"
"cat","*","Katze","true"
`,
      "utf8"
    );
    try {
      const g = new Glossary(undefined, user, ["de"]);
      const { text, replacements } = protectGlossaryForcedTerms("scatter", g, "de");
      expect(replacements).toHaveLength(0);
      expect(text).toBe("scatter");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
