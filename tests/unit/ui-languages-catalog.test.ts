import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  buildUiLanguageRowsFromMaster,
  effectiveUiLanguagesCodes,
  loadUiLanguagesMaster,
} from "../../src/core/ui-languages-catalog.js";
import type { I18nConfig } from "../../src/core/types.js";

function miniConfig(over: Partial<I18nConfig> = {}): I18nConfig {
  return {
    sourceLocale: "en-GB",
    targetLocales: ["de", "fr", "en-GB"],
    ...over,
  } as I18nConfig;
}

describe("ui-languages-catalog", () => {
  it("effectiveUiLanguagesCodes dedupes source and targets with manifest key rules", () => {
    const codes = effectiveUiLanguagesCodes(
      miniConfig({ sourceLocale: "en_GB", targetLocales: ["de", "en-GB"] })
    );
    expect(codes).toEqual(["en_GB", "de"]);
  });

  it("loadUiLanguagesMaster throws when file is not a JSON array", () => {
    const f = path.join(os.tmpdir(), `ui-lang-bad-${Date.now()}.json`);
    fs.writeFileSync(f, "{}", "utf8");
    try {
      expect(() => loadUiLanguagesMaster(f)).toThrow(/JSON array/);
    } finally {
      fs.unlinkSync(f);
    }
  });

  it("loadUiLanguagesMaster maps rows and defaults direction to ltr for invalid direction", () => {
    const f = path.join(os.tmpdir(), `ui-lang-good-${Date.now()}.json`);
    fs.writeFileSync(
      f,
      JSON.stringify([
        { code: "de", label: "Deutsch", englishName: "German", direction: "rtl" },
        { code: "x-Test", label: "", englishName: "", direction: "nope" },
      ]),
      "utf8"
    );
    try {
      const m = loadUiLanguagesMaster(f);
      expect(m.get("de")?.direction).toBe("rtl");
      const x = m.get("x_test");
      expect(x?.label).toBe("x-Test");
      expect(x?.englishName).toBe("x-Test");
      expect(x?.direction).toBe("ltr");
    } finally {
      fs.unlinkSync(f);
    }
  });

  it("buildUiLanguageRowsFromMaster warns and uses placeholders for unknown codes", () => {
    const f = path.join(os.tmpdir(), `ui-lang-master-${Date.now()}.json`);
    fs.writeFileSync(
      f,
      JSON.stringify([{ code: "de", label: "Deutsch", englishName: "German", direction: "ltr" }]),
      "utf8"
    );
    try {
      const master = loadUiLanguagesMaster(f);
      const { rows, warnings } = buildUiLanguageRowsFromMaster(
        miniConfig({ targetLocales: ["de", "xx-Unknown"] }),
        master
      );
      expect(rows).toHaveLength(3);
      expect(warnings.some((w) => w.includes("xx-Unknown"))).toBe(true);
      const unknown = rows.find((r) => r.code === "xx-Unknown");
      expect(unknown?.englishName).toMatch(/TODO/);
    } finally {
      fs.unlinkSync(f);
    }
  });
});
