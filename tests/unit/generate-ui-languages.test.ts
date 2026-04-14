import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import {
  effectiveUiLanguagesCodes,
  loadUiLanguagesMaster,
  runGenerateUiLanguages,
} from "../../src/cli/generate-ui-languages.js";

describe("generate-ui-languages", () => {
  it("effectiveUiLanguagesCodes dedupes and orders source first", () => {
    const c = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["de", "en-gb", "fr"],
        features: {
          extractUIStrings: false,
          translateUIStrings: false,
          translateMarkdown: false,
          translateJSON: false,
          translateSVG: false,
        },
      })
    );
    expect(effectiveUiLanguagesCodes(c)).toEqual(["en-GB", "de", "fr"]);
  });

  it("runGenerateUiLanguages writes rows from master and placeholders for unknown codes", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-ui-lang-"));
    try {
      const masterPath = path.join(tmp, "master.json");
      fs.writeFileSync(
        masterPath,
        JSON.stringify([
          { code: "en-GB", label: "English (UK)", englishName: "English (UK)", direction: "ltr" },
          { code: "de", label: "Deutsch", englishName: "German", direction: "ltr" },
        ]),
        "utf8"
      );
      const outRel = "locales/ui-languages.json";
      const config = parseI18nConfig(
        mergeWithDefaults({
          sourceLocale: "en-GB",
          targetLocales: ["de", "xx-YY"],
          uiLanguagesPath: outRel,
          features: {
            extractUIStrings: false,
            translateUIStrings: false,
            translateMarkdown: false,
            translateJSON: false,
            translateSVG: false,
          },
        })
      );
      const r = runGenerateUiLanguages(config, tmp, { masterPath, dryRun: false });
      expect(r.warnings.length).toBeGreaterThan(0);
      const written = JSON.parse(fs.readFileSync(path.join(tmp, outRel), "utf8")) as Array<{
        code: string;
        englishName: string;
      }>;
      expect(written).toHaveLength(3);
      const xx = written.find((x) => x.code === "xx-YY");
      expect(xx).toBeDefined();
      expect(xx!.englishName).toContain("TODO");
      expect(xx!.direction).toBe("ltr");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("loadUiLanguagesMaster maps normalized keys", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-master-"));
    try {
      const p = path.join(tmp, "m.json");
      fs.writeFileSync(
        p,
        JSON.stringify([
          { code: "pt-BR", label: "Português", englishName: "Portuguese (Brazil)", direction: "ltr" },
        ]),
        "utf8"
      );
      const m = loadUiLanguagesMaster(p);
      expect(m.get("pt_br")?.englishName).toBe("Portuguese (Brazil)");
      expect(m.get("pt_br")?.direction).toBe("ltr");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
