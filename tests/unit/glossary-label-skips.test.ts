import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GlossaryLabelSkipsError,
  readLabelCheckSkips,
  writeLabelCheckSkips,
} from "../../src/core/glossary-label-skips.js";

/** Throw a non-Error so catch sites that stringify unknown failures are exercised. */
function raiseNonError(value: string): never {
  throw value as unknown as Error;
}

describe("glossary label skips", () => {
  let dir: string;
  let configPath: string;

  function writeConfig(value: unknown): void {
    fs.writeFileSync(
      configPath,
      typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`
    );
  }

  function readConfig(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
  }

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "glossary-label-skips-"));
    configPath = path.join(dir, "ai-i18n-tools.config.json");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe("GlossaryLabelSkipsError", () => {
    it("is an Error with its own name", () => {
      const err = new GlossaryLabelSkipsError("boom");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("GlossaryLabelSkipsError");
      expect(err.message).toBe("boom");
    });
  });

  describe("readLabelCheckSkips", () => {
    it("returns an empty list when the glossary block is missing", () => {
      writeConfig({ sourceLocale: "en" });
      expect(readLabelCheckSkips(configPath)).toEqual([]);
    });

    it("returns an empty list when glossary is not an object", () => {
      writeConfig({ glossary: "nope" });
      expect(readLabelCheckSkips(configPath)).toEqual([]);
      writeConfig({ glossary: null });
      expect(readLabelCheckSkips(configPath)).toEqual([]);
      writeConfig({ glossary: [] });
      expect(readLabelCheckSkips(configPath)).toEqual([]);
    });

    it("returns an empty list when labelCheckSkips is absent", () => {
      writeConfig({ glossary: { userGlossary: "g.csv" } });
      expect(readLabelCheckSkips(configPath)).toEqual([]);
    });

    it("parses entries and applies the default locales", () => {
      writeConfig({
        glossary: {
          labelCheckSkips: [
            { term: "Target language" },
            { term: "Save", locales: ["uk"], files: ["docs/a.md"], note: "inflected" },
          ],
        },
      });
      expect(readLabelCheckSkips(configPath)).toEqual([
        { term: "Target language", locales: ["*"] },
        { term: "Save", locales: ["uk"], files: ["docs/a.md"], note: "inflected" },
      ]);
    });

    it("rejects entries that fail the schema", () => {
      writeConfig({ glossary: { labelCheckSkips: [{ term: "" }] } });
      expect(() => readLabelCheckSkips(configPath)).toThrow(GlossaryLabelSkipsError);
      writeConfig({ glossary: { labelCheckSkips: "not-an-array" } });
      expect(() => readLabelCheckSkips(configPath)).toThrow(GlossaryLabelSkipsError);
    });

    it("reports a missing file", () => {
      expect(() => readLabelCheckSkips(path.join(dir, "missing.json"))).toThrow(
        /Could not read .*missing\.json/
      );
    });

    it("reports invalid JSON", () => {
      writeConfig("{ not json");
      expect(() => readLabelCheckSkips(configPath)).toThrow(/Could not read/);
    });

    it("reports a non-Error read failure", () => {
      writeConfig({});
      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
        raiseNonError("disk");
      });
      expect(() => readLabelCheckSkips(configPath)).toThrow(/Could not read .*: disk/);
    });

    it("requires the config root to be an object", () => {
      for (const root of ["[]", "null", '"text"', "7"]) {
        writeConfig(root);
        expect(() => readLabelCheckSkips(configPath)).toThrow("Config root must be a JSON object");
      }
    });
  });

  describe("writeLabelCheckSkips", () => {
    const now = new Date("2026-11-08T22:50:00Z");

    it("writes the skips, keeps other keys, and returns the backup path", () => {
      writeConfig({ sourceLocale: "en", glossary: { userGlossary: "g.csv" } });
      const before = fs.readFileSync(configPath, "utf8");
      const backup = writeLabelCheckSkips(
        configPath,
        [{ term: "Save", locales: ["de"], note: "n" }],
        now
      );
      expect(readConfig()).toEqual({
        sourceLocale: "en",
        glossary: {
          userGlossary: "g.csv",
          labelCheckSkips: [{ term: "Save", locales: ["de"], note: "n" }],
        },
      });
      expect(fs.readFileSync(backup, "utf8")).toBe(before);
      expect(fs.readFileSync(configPath, "utf8").endsWith("}\n")).toBe(true);
    });

    it("creates the glossary block when it is missing", () => {
      writeConfig({ sourceLocale: "en" });
      writeLabelCheckSkips(configPath, [{ term: "Save", locales: ["*"] }], now);
      expect(readConfig().glossary).toEqual({
        labelCheckSkips: [{ term: "Save", locales: ["*"] }],
      });
    });

    it("replaces a glossary value that is not an object", () => {
      for (const glossary of ["text", null, []]) {
        writeConfig({ glossary });
        writeLabelCheckSkips(configPath, [{ term: "Save", locales: ["*"] }]);
        expect(readConfig().glossary).toEqual({
          labelCheckSkips: [{ term: "Save", locales: ["*"] }],
        });
      }
    });

    it("removes the key when the list is empty", () => {
      writeConfig({
        glossary: {
          userGlossary: "g.csv",
          labelCheckSkips: [{ term: "Save", locales: ["*"] }],
        },
      });
      writeLabelCheckSkips(configPath, [], now);
      expect(readConfig().glossary).toEqual({ userGlossary: "g.csv" });
    });

    it("round-trips through readLabelCheckSkips", () => {
      writeConfig({});
      const skips = [{ term: "Save", locales: ["uk", "de"], files: ["docs/**"] }];
      writeLabelCheckSkips(configPath, skips, now);
      expect(readLabelCheckSkips(configPath)).toEqual(skips);
    });

    it("uses the current time when none is given and picks a fresh backup name", () => {
      writeConfig({});
      const first = writeLabelCheckSkips(configPath, []);
      const second = writeLabelCheckSkips(configPath, []);
      expect(first).not.toBe(second);
      expect(fs.existsSync(first)).toBe(true);
      expect(fs.existsSync(second)).toBe(true);
    });

    it("rejects invalid skips before touching the file", () => {
      writeConfig({ sourceLocale: "en" });
      const before = fs.readFileSync(configPath, "utf8");
      expect(() => writeLabelCheckSkips(configPath, [{ term: "", locales: ["*"] }], now)).toThrow(
        GlossaryLabelSkipsError
      );
      expect(fs.readFileSync(configPath, "utf8")).toBe(before);
      expect(fs.readdirSync(dir)).toEqual(["ai-i18n-tools.config.json"]);
    });

    it("fails when the config cannot be read", () => {
      expect(() => writeLabelCheckSkips(path.join(dir, "missing.json"), [], now)).toThrow(
        /Could not read/
      );
    });

    it("reports a backup failure", () => {
      writeConfig({});
      vi.spyOn(fs, "copyFileSync").mockImplementation(() => {
        throw new Error("no space");
      });
      expect(() => writeLabelCheckSkips(configPath, [], now)).toThrow(
        /Could not back up .*: no space/
      );
    });

    it("reports a non-Error backup failure", () => {
      writeConfig({});
      vi.spyOn(fs, "copyFileSync").mockImplementation(() => {
        raiseNonError("copy-string");
      });
      expect(() => writeLabelCheckSkips(configPath, [], now)).toThrow(
        /Could not back up .*: copy-string/
      );
    });

    it("reports a write failure and keeps the original file", () => {
      writeConfig({ sourceLocale: "en" });
      const before = fs.readFileSync(configPath, "utf8");
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
        throw new Error("read-only");
      });
      expect(() =>
        writeLabelCheckSkips(configPath, [{ term: "Save", locales: ["*"] }], now)
      ).toThrow(/Could not write .*: read-only/);
      expect(fs.readFileSync(configPath, "utf8")).toBe(before);
    });

    it("reports a non-Error write failure", () => {
      writeConfig({});
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
        raiseNonError("write-string");
      });
      expect(() => writeLabelCheckSkips(configPath, [], now)).toThrow(
        /Could not write .*: write-string/
      );
    });
  });
});
