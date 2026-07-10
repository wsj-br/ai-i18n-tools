import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveNextraDictionarySource } from "../../src/cli/nextra-dictionary-translate.js";
import type { I18nDocTranslateConfig } from "../../src/core/types.js";

describe("nextra dictionary config", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("resolveNextraDictionarySource returns trimmed path", () => {
    const config = {
      doc: { nextraDictionaryPath: " app/_dictionaries/en.ts " },
    } as I18nDocTranslateConfig;
    expect(resolveNextraDictionarySource(config)).toBe("app/_dictionaries/en.ts");
  });

  it("dictionary source file exists in example layout", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextra-dict-"));
    const dictPath = path.join(tmpDir, "app/_dictionaries/en.ts");
    fs.mkdirSync(path.dirname(dictPath), { recursive: true });
    fs.writeFileSync(dictPath, `export default { siteTitle: "Demo" };\n`);
    expect(fs.existsSync(dictPath)).toBe(true);
  });
});
