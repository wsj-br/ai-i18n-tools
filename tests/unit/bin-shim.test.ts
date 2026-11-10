import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binShim = path.join(repoRoot, "bin", "ai-i18n-tools.mjs");
const binPathEntry = path.join(repoRoot, "bin", "ai-i18n-tools");
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
    expect(out).toMatch(/dashboard\|dash/);
    expect(out).toContain("Available languages for -L / --ui-lang:");
    expect(out).toContain("pt-BR (Portuguese (Brazil))");
    expect(out).toContain("en-GB - English (UK)");
    expect(out).toContain("de - Deutsch");
    expect(out).not.toContain("Deutsch — German");
    const footer = out.slice(out.lastIndexOf("Available languages for -L / --ui-lang:"));
    const listLines = footer
      .split("\n")
      .slice(1)
      .filter((line) => line.length > 0);
    expect(listLines.length).toBeGreaterThan(1);
    expect(listLines.every((line) => line.startsWith("  ") && line.length <= 80)).toBe(true);
  });

  it("lists shipped UI languages when -L has no code", () => {
    expect(fs.existsSync(cliEntry)).toBe(true);
    let stderr = "";
    let status = 0;
    try {
      execFileSync(process.execPath, [binShim, "-L"], {
        encoding: "utf8",
        cwd: repoRoot,
        env: { ...process.env, AI_I18N_LANG: "en-GB" },
      });
    } catch (error) {
      const failed = error as { stderr?: string; status?: number };
      stderr = failed.stderr ?? "";
      status = failed.status ?? 0;
    }
    expect(status).toBe(1);
    expect(stderr).toContain("option '-L, --ui-lang <code>' argument missing");
    expect(stderr).toContain("Available languages for -L / --ui-lang:");
    expect(stderr).toContain("pt-BR");
    expect(stderr).toContain("简体中文 — Chinese (Simplified)");

    let subcommandStderr = "";
    try {
      execFileSync(process.execPath, [binShim, "version", "-L"], {
        encoding: "utf8",
        cwd: repoRoot,
        env: { ...process.env, AI_I18N_LANG: "en-GB" },
      });
    } catch (error) {
      subcommandStderr = (error as { stderr?: string }).stderr ?? "";
    }
    expect(subcommandStderr).toContain("Available languages for -L / --ui-lang:");
    expect(subcommandStderr).toContain("fr");
  });

  it("accepts dash as an alias for dashboard", () => {
    expect(fs.existsSync(cliEntry)).toBe(true);
    const env = { ...process.env, AI_I18N_LANG: "en-GB" };
    const dashboardHelp = execFileSync(process.execPath, [binShim, "dashboard", "--help"], {
      encoding: "utf8",
      cwd: repoRoot,
      env,
    });
    const dashHelp = execFileSync(process.execPath, [binShim, "dash", "--help"], {
      encoding: "utf8",
      cwd: repoRoot,
      env,
    });
    expect(dashboardHelp).toMatch(/dashboard\|dash/);
    expect(dashHelp).toMatch(/dashboard\|dash/);
    expect(dashboardHelp).toMatch(/--port/);
    expect(dashHelp).toMatch(/--port/);
    expect(dashboardHelp).toMatch(/--no-open/);
    expect(dashHelp).toMatch(/--no-open/);
    expect(dashHelp).toContain("Launch the Translation Dashboard");
  });
});

describe("bin/ai-i18n-tools", () => {
  it("forwards to the published .mjs shim", () => {
    const source = fs.readFileSync(binPathEntry, "utf8");
    expect(source).toMatch(/import\s+["']\.\/ai-i18n-tools\.mjs["']/);
  });

  it("prints CLI help when invoked with --help", () => {
    expect(fs.existsSync(cliEntry)).toBe(true);
    const out = execFileSync(process.execPath, [binPathEntry, "--help"], {
      encoding: "utf8",
      cwd: repoRoot,
      env: { ...process.env, AI_I18N_LANG: "en-GB" },
    });
    expect(out).toMatch(/Usage:/i);
    expect(out).toMatch(/ai-i18n-tools/i);
    expect(out).toContain("zh-Hant (Chinese (Traditional))");
  });
});
