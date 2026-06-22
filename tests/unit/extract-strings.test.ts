import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import { runExtract } from "../../src/cli/extract-strings.js";
import { uiStringHash } from "../../src/extractors/ui-string-locations.js";

function minimalExtractConfig(overrides: Record<string, unknown> = {}) {
  return parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en-GB",
      targetLocales: ["de", "fr"],
      features: {
        translateUIStrings: false,
        translateDocs: false,
        translateJson: false,
        translateSVG: false,
      },
      ui: {
        sourceRoots: ["src"],
        stringsJson: "strings.json",
        flatOutputDir: "./locales",
        ...((overrides.ui as object) ?? {}),
      },
      uiLanguagesPath: "locales/ui-languages.json",
      ...overrides,
    })
  );
}

describe("runExtract includeUiLanguageEnglishNames", () => {
  it("merges englishName values from bundled master into strings.json", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extract-ui-lang-"));
    try {
      fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
      fs.mkdirSync(path.join(tmp, "locales"), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, "src", "app.tsx"),
        `export const x = () => t("Hello");\n`,
        "utf8"
      );

      const config = minimalExtractConfig({
        ui: {
          sourceRoots: ["src"],
          stringsJson: "strings.json",
          reactExtractor: { includeUiLanguageEnglishNames: true },
        },
      });

      runExtract(config, tmp);
      const out = JSON.parse(fs.readFileSync(path.join(tmp, "strings.json"), "utf8")) as Record<
        string,
        { source: string }
      >;

      const germanHash = uiStringHash("German");
      expect(out[germanHash]?.source).toBe("German");
      expect(Object.keys(out).length).toBeGreaterThanOrEqual(4);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("scanned string wins when same text as manifest englishName (collision)", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extract-collision-"));
    try {
      fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
      fs.mkdirSync(path.join(tmp, "locales"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "src", "app.tsx"), `t("French");\n`, "utf8");

      const config = minimalExtractConfig({
        targetLocales: ["fr"],
        ui: {
          sourceRoots: ["src"],
          stringsJson: "strings.json",
          reactExtractor: { includeUiLanguageEnglishNames: true },
        },
      });

      runExtract(config, tmp);
      const out = JSON.parse(fs.readFileSync(path.join(tmp, "strings.json"), "utf8")) as Record<
        string,
        { source: string }
      >;
      const h = uiStringHash("French");
      expect(Object.keys(out).filter((k) => out[k]?.source === "French")).toHaveLength(1);
      expect(out[h]?.source).toBe("French");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("is idempotent when re-run", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extract-idem-"));
    try {
      fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
      fs.mkdirSync(path.join(tmp, "locales"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "src", "x.tsx"), `t("A");\n`, "utf8");

      const config = minimalExtractConfig({
        targetLocales: ["de"],
        ui: {
          sourceRoots: ["src"],
          stringsJson: "strings.json",
          reactExtractor: { includeUiLanguageEnglishNames: true },
        },
      });

      runExtract(config, tmp);
      const first = fs.readFileSync(path.join(tmp, "strings.json"), "utf8");
      runExtract(config, tmp);
      const second = fs.readFileSync(path.join(tmp, "strings.json"), "utf8");
      expect(second).toBe(first);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("throws when plurals:true has multiple placeholders without {{count}}", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extract-plural-err-"));
    try {
      fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, "src", "bad.tsx"),
        `t("Hello {{name}}, you have {{msgs}} messages", { plurals: true });\n`,
        "utf8"
      );

      const config = minimalExtractConfig();

      expect(() => runExtract(config, tmp)).toThrow(/must include \{\{count\}\}/);
      expect(fs.existsSync(path.join(tmp, "strings.json"))).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("captures data-i18n marker strings from .html sources with index.html locations", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extract-html-"));
    try {
      fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, "src", "index.html"),
        [
          `<button data-i18n>Next</button>`,
          `<input data-i18n-placeholder placeholder="Filename (partial)" />`,
          `<button data-i18n="Save">overridden</button>`,
          `<code>npm run build</code>`,
        ].join("\n"),
        "utf8"
      );

      const config = minimalExtractConfig({
        targetLocales: ["de"],
        ui: {
          sourceRoots: ["src"],
          stringsJson: "strings.json",
          uiExtractor: {
            extensions: [".ts", ".tsx", ".html"],
            includeUiLanguageEnglishNames: false,
          },
        },
      });

      runExtract(config, tmp);
      const out = JSON.parse(fs.readFileSync(path.join(tmp, "strings.json"), "utf8")) as Record<
        string,
        { source: string; locations?: Array<{ file: string; line: number }> }
      >;

      const nextHash = uiStringHash("Next");
      expect(out[nextHash]?.source).toBe("Next");
      expect(out[nextHash]?.locations?.[0]?.file).toBe("src/index.html");
      expect(out[uiStringHash("Filename (partial)")]?.source).toBe("Filename (partial)");
      expect(out[uiStringHash("Save")]?.source).toBe("Save");
      // Code-like content is not a marker source.
      expect(out[uiStringHash("npm run build")]).toBeUndefined();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("writes ui-languages.json on extract", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "extract-ui-json-"));
    try {
      fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "src", "x.tsx"), `t("Only");\n`, "utf8");

      const config = minimalExtractConfig({
        targetLocales: ["de"],
        ui: {
          sourceRoots: ["src"],
          stringsJson: "strings.json",
          reactExtractor: { includeUiLanguageEnglishNames: false },
        },
      });

      runExtract(config, tmp);
      const manifestPath = path.join(tmp, "locales", "ui-languages.json");
      expect(fs.existsSync(manifestPath)).toBe(true);
      const rows = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Array<{ code: string }>;
      expect(rows.some((r) => r.code === "de")).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
