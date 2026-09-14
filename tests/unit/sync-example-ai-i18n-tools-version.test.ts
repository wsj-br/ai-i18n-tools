import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const modUrl = pathToFileURL(
  path.join(repoRoot, "scripts", "sync-example-ai-i18n-tools-version.mjs")
).href;
const { expectedAiI18nToolsRange, listExampleAiI18nToolsPins, syncExampleAiI18nToolsVersion } =
  await import(modUrl);

const tmpDirs: string[] = [];

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function makeFixture(version: string, exampleRange: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-example-pins-"));
  tmpDirs.push(dir);
  fs.writeFileSync(
    path.join(dir, "package.json"),
    `${JSON.stringify({ name: "root", version }, null, 2)}\n`
  );
  const exampleDir = path.join(dir, "examples", "demo");
  fs.mkdirSync(exampleDir, { recursive: true });
  fs.writeFileSync(
    path.join(exampleDir, "package.json"),
    `${JSON.stringify(
      {
        name: "demo",
        dependencies: { "ai-i18n-tools": exampleRange, other: "^1.0.0" },
      },
      null,
      2
    )}\n`
  );
  return dir;
}

describe("syncExampleAiI18nToolsVersion", () => {
  it("rewrites a stale example pin to ^<root version> without touching other deps", () => {
    const root = makeFixture("1.8.9", "^1.8.8");
    const result = syncExampleAiI18nToolsVersion(root);
    expect(result.expected).toBe("^1.8.9");
    expect(result.updated).toHaveLength(1);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, "examples", "demo", "package.json"), "utf8")
    );
    expect(pkg.dependencies["ai-i18n-tools"]).toBe("^1.8.9");
    expect(pkg.dependencies.other).toBe("^1.0.0");
  });

  it("--check reports mismatches without writing", () => {
    const root = makeFixture("1.8.9", "^1.7.2");
    const before = fs.readFileSync(path.join(root, "examples", "demo", "package.json"), "utf8");
    const result = syncExampleAiI18nToolsVersion(root, { checkOnly: true });
    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]?.range).toBe("^1.7.2");
    expect(result.updated).toEqual([]);
    expect(fs.readFileSync(path.join(root, "examples", "demo", "package.json"), "utf8")).toBe(
      before
    );
  });

  it("expectedAiI18nToolsRange prefixes a caret", () => {
    expect(expectedAiI18nToolsRange("1.8.9")).toBe("^1.8.9");
  });
});

describe("example package.json pins in this repo", () => {
  it("match the root package version", () => {
    const result = syncExampleAiI18nToolsVersion(repoRoot, { checkOnly: true });
    expect(result.mismatches).toEqual([]);
    expect(listExampleAiI18nToolsPins(repoRoot).length).toBeGreaterThan(0);
  });
});
