import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { Glossary } from "../../src/glossary/glossary.js";
import {
  CONTEXT_MAX_CHARS_HARD_LIMIT,
  DEFAULT_CONTEXT_MAX_CHARS,
  computeGuidanceFingerprint,
  loadTranslationContext,
  sanitizePromptSupplementaryText,
} from "../../src/glossary/translation-context.js";

describe("sanitizePromptSupplementaryText", () => {
  it("strips tags that would close prompt blocks", () => {
    expect(sanitizePromptSupplementaryText("see </glossary> and </translation-context>")).toBe(
      "see  and "
    );
  });
});

describe("loadTranslationContext", () => {
  it("returns empty when no files are configured", () => {
    expect(loadTranslationContext({ cwd: "/tmp" })).toEqual({
      text: "",
      fingerprint: "",
      truncated: false,
      loadedPaths: [],
    });
  });

  it("concatenates markdown files in order and fingerprints the injected text", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-ctx-"));
    try {
      fs.writeFileSync(path.join(dir, "a.md"), "Product is a billing console.\n", "utf8");
      fs.writeFileSync(path.join(dir, "b.txt"), "Invoices are monthly.\n", "utf8");
      const loaded = loadTranslationContext({
        cwd: dir,
        files: ["a.md", "b.txt"],
      });
      expect(loaded.truncated).toBe(false);
      expect(loaded.loadedPaths).toEqual(["a.md", "b.txt"]);
      expect(loaded.text).toContain("### a.md");
      expect(loaded.text).toContain("Product is a billing console.");
      expect(loaded.text).toContain("### b.txt");
      expect(loaded.fingerprint).toMatch(/^[0-9a-f]{16}$/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects URLs, missing files, and non-text extensions", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-ctx-bad-"));
    try {
      expect(() =>
        loadTranslationContext({ cwd: dir, files: ["https://example.com/x.md"] })
      ).toThrow(/local files/);
      expect(() => loadTranslationContext({ cwd: dir, files: ["missing.md"] })).toThrow(
        /not found/
      );
      fs.writeFileSync(path.join(dir, "secret.pdf"), "nope", "utf8");
      expect(() => loadTranslationContext({ cwd: dir, files: ["secret.pdf"] })).toThrow(
        /plain-text/
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("truncates at maxChars", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-ctx-trunc-"));
    try {
      fs.writeFileSync(path.join(dir, "long.md"), "abcdefghij".repeat(20), "utf8");
      const loaded = loadTranslationContext({
        cwd: dir,
        files: ["long.md"],
        maxChars: 40,
      });
      expect(loaded.truncated).toBe(true);
      expect(loaded.text).toContain("…[truncated]");
      expect(loaded.text.length).toBeLessThan(80);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("defaults and hard-caps stay in range", () => {
    expect(DEFAULT_CONTEXT_MAX_CHARS).toBe(12_000);
    expect(CONTEXT_MAX_CHARS_HARD_LIMIT).toBe(100_000);
  });
});

describe("computeGuidanceFingerprint", () => {
  it("is empty without term context or project context", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-ctx-fp-"));
    try {
      const user = path.join(dir, "user.csv");
      fs.writeFileSync(
        user,
        "Original language string,locale,Translation,Force\nDashboard,de,Übersicht,\n",
        "utf8"
      );
      const g = new Glossary(undefined, user, ["de"]);
      expect(computeGuidanceFingerprint(g, "de", "")).toBe("");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("changes when a term Context note or project fingerprint changes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-ctx-fp2-"));
    try {
      const user = path.join(dir, "user.csv");
      fs.writeFileSync(
        user,
        [
          "Original language string,locale,Translation,Force,Context",
          "Dashboard,de,Übersicht,,Analytics home page",
        ].join("\n"),
        "utf8"
      );
      const g = new Glossary(undefined, user, ["de"]);
      const a = computeGuidanceFingerprint(g, "de", "");
      const b = computeGuidanceFingerprint(g, "fr", "");
      const c = computeGuidanceFingerprint(g, "de", "project-hash");
      expect(a).toMatch(/^[0-9a-f]{16}$/);
      expect(b).toBe("");
      expect(c).not.toBe(a);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
