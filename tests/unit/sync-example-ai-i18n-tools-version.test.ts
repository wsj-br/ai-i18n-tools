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

  it("rewrites stale plugin manifest versions and leaves a missing manifest file alone", () => {
    const root = makeFixture("1.8.9", "^1.8.9");
    const pluginPath = path.join(root, "plugin.json");
    const claudePluginPath = path.join(root, ".claude-plugin", "plugin.json");
    const marketplacePath = path.join(root, ".claude-plugin", "marketplace.json");
    fs.mkdirSync(path.dirname(claudePluginPath), { recursive: true });
    fs.writeFileSync(
      pluginPath,
      `${JSON.stringify({ name: "ai-i18n-tools", version: "0.0.1" }, null, 2)}\n`
    );
    fs.writeFileSync(
      claudePluginPath,
      `${JSON.stringify({ name: "ai-i18n-tools", version: "0.0.1", description: "keep" }, null, 2)}\n`
    );
    fs.writeFileSync(
      marketplacePath,
      `${JSON.stringify(
        {
          name: "ai-i18n-tools",
          metadata: { description: "keep", version: "0.0.1" },
          plugins: [{ name: "ai-i18n-tools", version: "0.0.1", source: "./" }],
        },
        null,
        2
      )}\n`
    );

    const result = syncExampleAiI18nToolsVersion(root);
    expect(result.version).toBe("1.8.9");
    expect(result.manifestsUpdated).toHaveLength(3);
    expect(result.updated).toEqual([]);
    expect(JSON.parse(fs.readFileSync(pluginPath, "utf8")).version).toBe("1.8.9");
    expect(JSON.parse(fs.readFileSync(claudePluginPath, "utf8"))).toMatchObject({
      version: "1.8.9",
      description: "keep",
    });
    const marketplace = JSON.parse(fs.readFileSync(marketplacePath, "utf8"));
    expect(marketplace.metadata.version).toBe("1.8.9");
    expect(marketplace.metadata.description).toBe("keep");
    expect(marketplace.plugins[0].version).toBe("1.8.9");
    expect(marketplace.plugins[0].source).toBe("./");
    expect(fs.existsSync(path.join(root, ".agents", "plugins", "marketplace.json"))).toBe(false);
  });

  it("--check reports a stale manifest version without writing it", () => {
    const root = makeFixture("1.8.9", "^1.8.9");
    const pluginPath = path.join(root, "plugin.json");
    const before = `${JSON.stringify({ name: "ai-i18n-tools", version: "0.0.1" }, null, 2)}\n`;
    fs.writeFileSync(pluginPath, before);
    const result = syncExampleAiI18nToolsVersion(root, { checkOnly: true });
    expect(result.manifestMismatches).toEqual([
      { file: pluginPath, pointer: "version", version: "0.0.1" },
    ]);
    expect(result.manifestsUpdated).toEqual([]);
    expect(fs.readFileSync(pluginPath, "utf8")).toBe(before);
  });
});

describe("example package.json pins in this repo", () => {
  it("match the root package version", () => {
    const result = syncExampleAiI18nToolsVersion(repoRoot, { checkOnly: true });
    expect(result.mismatches).toEqual([]);
    expect(result.manifestMismatches).toEqual([]);
    expect(listExampleAiI18nToolsPins(repoRoot).length).toBeGreaterThan(0);
    const version = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")
    ).version;
    for (const rel of [
      "plugin.json",
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json",
    ]) {
      expect(fs.existsSync(path.join(repoRoot, rel)), rel).toBe(true);
    }
    expect(JSON.parse(fs.readFileSync(path.join(repoRoot, "plugin.json"), "utf8")).version).toBe(
      version
    );
  });
});
