import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configBackupPath,
  replaceProviderTranslationModels,
  TranslationModelsApplyError,
} from "../../src/core/apply-translation-models.js";

/** Throw a non-Error so catch sites that stringify unknown failures are exercised. */
function raiseNonError(value: string): never {
  throw value as unknown as Error;
}

const sample = {
  sourceLocale: "en",
  providers: {
    openai: {
      translationModels: ["old"],
      uiModels: ["keep-ui"],
    },
  },
};

function writeSample(name = "ai-i18n-tools.config.json"): {
  dir: string;
  configPath: string;
  before: string;
} {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apply-models-"));
  const configPath = path.join(dir, name);
  const before = `${JSON.stringify(sample, null, 2)}\n`;
  fs.writeFileSync(configPath, before);
  return { dir, configPath, before };
}

describe("replaceProviderTranslationModels", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("trims model ids and names a backup for a config path with no extension", () => {
    const { configPath, before } = writeSample("config");
    const now = new Date("2026-10-23T00:20:00.123Z");
    const backupPath = replaceProviderTranslationModels(
      configPath,
      "openai",
      ["  alpha  ", "beta"],
      now
    );
    expect(path.basename(backupPath)).toBe("config.2026-10-23T00-20-00-123Z.backup.json");
    expect(fs.readFileSync(backupPath, "utf8")).toBe(before);
    const written = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      providers: { openai: { translationModels: string[] } };
    };
    expect(written.providers.openai.translationModels).toEqual(["alpha", "beta"]);
  });

  it("rejects an empty model list and a list that trims down to fewer ids", () => {
    const { configPath } = writeSample();
    expect(() => replaceProviderTranslationModels(configPath, "openai", [])).toThrow(
      TranslationModelsApplyError
    );
    expect(() => replaceProviderTranslationModels(configPath, "openai", ["  "])).toThrow(
      /non-empty list of model ids/
    );
    expect(() => replaceProviderTranslationModels(configPath, "openai", ["alpha", " "])).toThrow(
      /non-empty list of model ids/
    );
    const written = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      providers: { openai: { translationModels: string[] } };
    };
    expect(written.providers.openai.translationModels).toEqual(["old"]);
  });

  it("throws when the config cannot be read or is not an object", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apply-models-read-"));
    const missing = path.join(dir, "missing.json");
    expect(() => replaceProviderTranslationModels(missing, "openai", ["alpha"])).toThrow(
      /Could not read/
    );

    const invalid = path.join(dir, "invalid.json");
    fs.writeFileSync(invalid, "{");
    expect(() => replaceProviderTranslationModels(invalid, "openai", ["alpha"])).toThrow(
      /Could not read/
    );

    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      raiseNonError("disk");
    });
    expect(() => replaceProviderTranslationModels(invalid, "openai", ["alpha"])).toThrow(/disk/);
  });

  it("throws when the root, providers, or provider entry has the wrong shape", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "apply-models-shape-"));
    const cases: Array<[string, string]> = [
      ["null.json", "null"],
      ["array.json", "[]"],
      ["string.json", '"hi"'],
      ["no-providers.json", "{}"],
      ["providers-null.json", '{"providers":null}'],
      ["providers-array.json", '{"providers":[]}'],
      ["providers-string.json", '{"providers":"openai"}'],
      ["missing-provider.json", '{"providers":{}}'],
      ["provider-null.json", '{"providers":{"openai":null}}'],
      ["provider-array.json", '{"providers":{"openai":[]}}'],
      ["provider-number.json", '{"providers":{"openai":1}}'],
    ];
    for (const [name, body] of cases) {
      const configPath = path.join(dir, name);
      fs.writeFileSync(configPath, body);
      expect(() => replaceProviderTranslationModels(configPath, "openai", ["alpha"])).toThrow(
        TranslationModelsApplyError
      );
    }
  });

  it("leaves the config unchanged when the backup copy fails", () => {
    const { configPath, before } = writeSample();
    vi.spyOn(fs, "copyFileSync").mockImplementation(() => {
      throw new Error("disk full");
    });
    expect(() => replaceProviderTranslationModels(configPath, "openai", ["alpha"])).toThrow(
      /Could not back up/
    );
    vi.mocked(fs.copyFileSync).mockImplementation(() => {
      raiseNonError("copy-string");
    });
    expect(() => replaceProviderTranslationModels(configPath, "openai", ["alpha"])).toThrow(
      /copy-string/
    );
    expect(fs.readFileSync(configPath, "utf8")).toBe(before);
  });

  it("leaves the config unchanged when the write fails after the backup", () => {
    const { configPath, before } = writeSample();
    const now = new Date("2026-10-23T00:20:00.123Z");
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      throw new Error("read only");
    });
    expect(() => replaceProviderTranslationModels(configPath, "openai", ["alpha"], now)).toThrow(
      /Could not write/
    );
    vi.mocked(fs.writeFileSync).mockImplementation(() => {
      raiseNonError("write-string");
    });
    expect(() => replaceProviderTranslationModels(configPath, "openai", ["alpha"], now)).toThrow(
      /write-string/
    );
    vi.mocked(fs.writeFileSync).mockRestore();
    expect(fs.readFileSync(configPath, "utf8")).toBe(before);
    expect(
      fs.existsSync(
        path.join(
          path.dirname(configPath),
          "ai-i18n-tools.config.2026-10-23T00-20-00-123Z.backup.json"
        )
      )
    ).toBe(true);
  });

  it("throws when every backup name is already taken", () => {
    const { configPath } = writeSample();
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    expect(() => configBackupPath(configPath, new Date("2026-10-23T00:20:00.123Z"))).toThrow(
      /Could not choose a backup path/
    );
  });
});
