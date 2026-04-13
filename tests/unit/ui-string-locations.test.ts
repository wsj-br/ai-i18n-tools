import {
  aggregateUiStringLocations,
  collectUiStringLocationsFromSource,
  defaultFuncNamesFromConfig,
  uiStringHash,
  packageJsonDescriptionLocation,
} from "../../src/extractors/ui-string-locations.js";
import fs from "fs";
import os from "os";
import path from "path";

describe("ui-string-locations", () => {
  it("uiStringHash matches 8-char md5 prefix", () => {
    expect(uiStringHash("hello")).toHaveLength(8);
    expect(uiStringHash("hello")).toMatch(/^[0-9a-f]+$/);
  });

  it("collectUiStringLocationsFromSource finds t() literal and line", () => {
    const content = `import { t } from "i18n";\nconst x = t("Hello world");\n`;
    const map = collectUiStringLocationsFromSource(content, "src/App.tsx", ["t"]);
    const h = uiStringHash("Hello world");
    expect(map.get(h)).toEqual([{ file: "src/App.tsx", line: 2 }]);
  });

  it("defaultFuncNamesFromConfig respects config or defaults", () => {
    expect(defaultFuncNamesFromConfig({ funcNames: ["foo"] })).toEqual(["foo"]);
    expect(defaultFuncNamesFromConfig()).toEqual(["t", "i18n.t"]);
  });

  it("aggregateUiStringLocations merges scanned files and package.json description", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-loc-agg-"));
    const pj = path.join(dir, "package.json");
    fs.writeFileSync(
      pj,
      JSON.stringify({ name: "n", description: "Package tagline" }),
      "utf8"
    );
    try {
      const merged = aggregateUiStringLocations(
        ["src/App.tsx", "src/B.tsx"],
        (rel) => {
          if (rel === "src/App.tsx") {
            return `t("FromFileA");\n`;
          }
          return `t("FromFileB");\n`;
        },
        ["t"],
        { packageJsonPath: pj, cwd: dir, includePackageDescription: true }
      );
      expect(merged.get(uiStringHash("FromFileA"))).toBeDefined();
      expect(merged.get(uiStringHash("Package tagline"))).toBeDefined();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("aggregateUiStringLocations skips package when includePackageDescription is false", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-loc-skip-"));
    const pj = path.join(dir, "package.json");
    fs.writeFileSync(pj, JSON.stringify({ description: "OnlyPkg" }), "utf8");
    try {
      const merged = aggregateUiStringLocations(
        ["x.ts"],
        () => `t("code");\n`,
        ["t"],
        { packageJsonPath: pj, cwd: dir, includePackageDescription: false }
      );
      expect(merged.get(uiStringHash("OnlyPkg"))).toBeUndefined();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("packageJsonDescriptionLocation finds description line", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-"));
    const pj = path.join(dir, "package.json");
    fs.writeFileSync(
      pj,
      `{
  "name": "x",
  "description": "My app"
}\n`
    );
    const loc = packageJsonDescriptionLocation(pj, dir);
    expect(loc.file).toBe("package.json");
    expect(loc.line).toBeGreaterThanOrEqual(1);
  });
});
