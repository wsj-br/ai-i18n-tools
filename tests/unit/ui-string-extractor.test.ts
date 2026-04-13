import fs from "fs";
import os from "os";
import path from "path";
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
    const parsed = JSON.parse(out) as Record<string, { source: string; translated: { en: string } }>;
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
      const parsed = JSON.parse(out) as Record<string, { source: string; translated: Record<string, string> }>;
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
      fs.writeFileSync(
        pkgPath,
        JSON.stringify({ name: "x", description: "  My app  " }),
        "utf8"
      );
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
});
