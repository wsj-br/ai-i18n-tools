import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binShim = path.join(repoRoot, "bin", "ai-i18n-tools.mjs");
const cliEntry = path.join(repoRoot, "dist", "cli", "index.js");

describe("bin/ai-i18n-tools.mjs", () => {
  it("loads the CLI via pathToFileURL so Windows absolute paths are valid ESM URLs", () => {
    const source = fs.readFileSync(binShim, "utf8");
    expect(source).toMatch(/pathToFileURL/);
    expect(source).toMatch(/await\s+import\(\s*pathToFileURL\s*\(\s*cliEntry\s*\)\s*\.href\s*\)/);
    // Regression for ERR_UNSUPPORTED_ESM_URL_SCHEME: bare `C:\...` paths are not
    // valid ESM module specifiers; file:// URLs are.
    expect(pathToFileURL(cliEntry).href).toMatch(/^file:/);
  });

  it("prints CLI help when invoked with --help", () => {
    expect(fs.existsSync(cliEntry)).toBe(true);
    const out = execFileSync(process.execPath, [binShim, "--help"], {
      encoding: "utf8",
      cwd: repoRoot,
      env: { ...process.env, AI_I18N_LANG: "en-GB" },
    });
    expect(out).toMatch(/Usage:/i);
    expect(out).toMatch(/ai-i18n-tools/i);
  });
});
