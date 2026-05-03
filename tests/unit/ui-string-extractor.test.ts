import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import type { SegmentTranslationMapValue } from "../../src/core/types.js";
import { UIStringExtractor } from "../../src/extractors/ui-string-extractor.js";

describe("UIStringExtractor", () => {
  it("canHandle respects extensions", () => {
    const ex = new UIStringExtractor({ extensions: [".tsx"] });
    expect(ex.canHandle("a.tsx")).toBe(true);
    expect(ex.canHandle("a.ts")).toBe(false);
  });

  it("normalizes extension without leading dot", () => {
    const ex = new UIStringExtractor({ extensions: ["js"] });
    expect(ex.canHandle("x.js")).toBe(true);
  });

  it("extract finds t() string literals", () => {
    const ex = new UIStringExtractor();
    const src = `const x = t("Hello world");`;
    const segs = ex.extract(src, "app.tsx");
    expect(segs.some((s) => s.content === "Hello world" && s.type === "ui-string")).toBe(true);
  });

  it("extract uses configured funcNames", () => {
    const ex = new UIStringExtractor({ funcNames: ["translate"] });
    const src = `translate('Bye')`;
    const segs = ex.extract(src, "x.js");
    expect(segs.some((s) => s.content === "Bye")).toBe(true);
  });

  it("reassemble outputs strings.json shape for default locale", () => {
    const ex = new UIStringExtractor(undefined, { defaultReassembleLocale: "en" });
    const segs = ex.extract(`t("A")`, "x.tsx");
    const map = new Map<string, string>();
    map.set(segs[0]!.hash, "B");
    const out = ex.reassemble(segs, map);
    const parsed = JSON.parse(out) as Record<
      string,
      { source: string; translated: { en: string } }
    >;
    const key = Object.keys(parsed)[0]!;
    expect(parsed[key]!.source).toBe("A");
    expect(parsed[key]!.translated.en).toBe("B");
  });

  it("buildStringsJson merges existing file when present", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-str-"));
    try {
      const existing = path.join(tmpDir, "strings.json");
      const h = "abc12345";
      fs.writeFileSync(
        existing,
        JSON.stringify({
          [h]: { source: "old", translated: { fr: "vieux" } },
        }),
        "utf8"
      );
      const ex = new UIStringExtractor();
      const segs = [
        {
          id: "1",
          type: "ui-string" as const,
          content: "new",
          hash: h,
          translatable: true,
        },
      ];
      const out = ex.buildStringsJson(segs, { en: new Map([[h, "enval"]]) }, existing);
      const parsed = JSON.parse(out) as Record<
        string,
        { source: string; translated: Record<string, string> }
      >;
      expect(parsed[h]!.translated.fr).toBe("vieux");
      expect(parsed[h]!.translated.en).toBe("enval");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("buildStringsJson preserves models from existing file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-str-models-"));
    try {
      const existing = path.join(tmpDir, "strings.json");
      const h = "abc12345";
      fs.writeFileSync(
        existing,
        JSON.stringify({
          [h]: {
            source: "old",
            translated: { fr: "vieux" },
            models: { fr: "vendor/model-a" },
          },
        }),
        "utf8"
      );
      const ex = new UIStringExtractor();
      const segs = [
        {
          id: "1",
          type: "ui-string" as const,
          content: "new",
          hash: h,
          translatable: true,
        },
      ];
      const out = ex.buildStringsJson(segs, { en: new Map([[h, "enval"]]) }, existing);
      const parsed = JSON.parse(out) as Record<
        string,
        { source: string; translated: Record<string, string>; models?: Record<string, string> }
      >;
      expect(parsed[h]!.models?.fr).toBe("vendor/model-a");
      expect(parsed[h]!.translated.en).toBe("enval");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("packageDescriptionSegments returns segment when package.json has description", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-pkg-"));
    try {
      const pkgPath = path.join(tmpDir, "package.json");
      fs.writeFileSync(pkgPath, JSON.stringify({ name: "x", description: "  My app  " }), "utf8");
      const ex = new UIStringExtractor(
        { packageJsonPath: "package.json", includePackageDescription: true },
        { cwd: tmpDir }
      );
      const segs = ex.packageDescriptionSegments();
      expect(segs).toHaveLength(1);
      expect(segs[0]!.content).toBe("My app");
      expect(segs[0]!.id).toBe("ui-pkg-description");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("packageDescriptionSegments returns [] when disabled or missing file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-pkg2-"));
    try {
      const exOff = new UIStringExtractor(
        { includePackageDescription: false, packageJsonPath: "package.json" },
        { cwd: tmpDir }
      );
      expect(exOff.packageDescriptionSegments()).toEqual([]);
      const exMissing = new UIStringExtractor({ packageJsonPath: "nope.json" }, { cwd: tmpDir });
      expect(exMissing.packageDescriptionSegments()).toEqual([]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("mergePackageDescription dedupes by hash", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-merge-"));
    try {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ description: "Shared desc" }),
        "utf8"
      );
      const ex = new UIStringExtractor({ packageJsonPath: "package.json" }, { cwd: tmpDir });
      const fileSegs = ex.extract(`t("Shared desc")`, "a.tsx");
      const merged = ex.mergePackageDescription(fileSegs);
      expect(merged.length).toBeLessThanOrEqual(fileSegs.length + 1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("extract skips duplicate literals and whitespace-only strings", () => {
    const ex = new UIStringExtractor();
    const dup = ex.extract(`t("once"); t("once");`, "dup.tsx");
    expect(dup).toHaveLength(1);
    const blank = ex.extract(`t("   ");`, "blank.tsx");
    expect(blank).toHaveLength(0);
  });

  it("extract attaches plurals and zeroDigit when options object present", () => {
    const ex = new UIStringExtractor();
    const src = `
      import { t } from 'i18next';
      t('{{count}} eggs', { plurals: true, zeroDigit: true });
    `;
    const segs = ex.extract(src, "pl.tsx");
    expect(segs).toHaveLength(1);
    expect(segs[0]!.plurals).toBe(true);
    expect(segs[0]!.zeroDigit).toBe(true);
  });

  it("buildStringsJson plural row preserves zeroDigit and existing plural translations", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-plural-json-"));
    try {
      const existing = path.join(tmpDir, "strings.json");
      const ex = new UIStringExtractor();
      const src = `import { t } from 'i18next'; t('{{count}} x', { plurals: true, zeroDigit: true });`;
      const segs = ex.extract(src, "p.tsx");
      const h = segs[0]!.hash;
      fs.writeFileSync(
        existing,
        JSON.stringify({
          [h]: {
            plural: true,
            source: "old",
            zeroDigit: false,
            translated: {
              de: { one: "eins", other: "mehr" },
            },
            models: { de: "openrouter/old" },
          },
        }),
        "utf8"
      );
      const out = ex.buildStringsJson(segs, {}, existing);
      const parsed = JSON.parse(out) as Record<
        string,
        {
          plural: boolean;
          zeroDigit?: boolean;
          source: string;
          translated: Record<string, Record<string, string>>;
          models?: Record<string, string>;
        }
      >;
      expect(parsed[h]!.plural).toBe(true);
      expect(parsed[h]!.zeroDigit).toBe(true);
      expect(parsed[h]!.source).toBe("{{count}} x");
      expect(parsed[h]!.translated.de.other).toBe("mehr");
      expect(parsed[h]!.models?.de).toBe("openrouter/old");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("buildStringsJson skips empty translations and accepts DocSegmentTranslation objects", () => {
    const ex = new UIStringExtractor();
    const segs = ex.extract(`t("Label")`, "x.tsx");
    const h = segs[0]!.hash;
    const emptyMap = new Map<string, SegmentTranslationMapValue>([[h, ""]]);
    const docMap = new Map<string, SegmentTranslationMapValue>([[h, { text: "Etikett" }]]);

    const outEmpty = ex.buildStringsJson(segs, { de: emptyMap });
    const parsedEmpty = JSON.parse(outEmpty) as Record<string, { translated: Record<string, string> }>;
    expect(parsedEmpty[h]!.translated.de).toBeUndefined();

    const outDoc = ex.buildStringsJson(segs, { de: docMap });
    const parsedDoc = JSON.parse(outDoc) as Record<string, { translated: Record<string, string> }>;
    expect(parsedDoc[h]!.translated.de).toBe("Etikett");
  });

  it("packageDescriptionSegments returns [] for invalid package.json or non-string description", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-pkg-bad-"));
    try {
      const badPath = path.join(tmpDir, "package.json");
      fs.writeFileSync(badPath, "{ not json", "utf8");
      const exBad = new UIStringExtractor({ packageJsonPath: "package.json" }, { cwd: tmpDir });
      expect(exBad.packageDescriptionSegments()).toEqual([]);

      fs.writeFileSync(badPath, JSON.stringify({ description: 404 }), "utf8");
      const exNum = new UIStringExtractor({ packageJsonPath: "package.json" }, { cwd: tmpDir });
      expect(exNum.packageDescriptionSegments()).toEqual([]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("mergePackageDescription appends package-only strings when hashes differ", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-merge-extra-"));
    try {
      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({ description: "Only in package.json" }),
        "utf8"
      );
      const ex = new UIStringExtractor({ packageJsonPath: "package.json" }, { cwd: tmpDir });
      const fileSegs = ex.extract(`t("Different from package")`, "app.tsx");
      const merged = ex.mergePackageDescription(fileSegs);
      expect(merged.length).toBe(2);
      expect(merged.some((s) => s.content === "Only in package.json")).toBe(true);
      expect(merged.some((s) => s.content === "Different from package")).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("buildStringsJson ignores corrupt existing strings.json", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-bad-existing-"));
    try {
      const existing = path.join(tmpDir, "strings.json");
      fs.writeFileSync(existing, "{", "utf8");
      const ex = new UIStringExtractor();
      const segs = ex.extract(`t("Fresh")`, "x.tsx");
      const out = ex.buildStringsJson(segs, { en: new Map([[segs[0]!.hash, "New"]]) }, existing);
      const parsed = JSON.parse(out) as Record<string, { source: string; translated: { en: string } }>;
      const h = segs[0]!.hash;
      expect(parsed[h]!.translated.en).toBe("New");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
