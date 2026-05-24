import { describe, expect, it } from "vitest";
import path from "path";
import { expandJsonBlockOutputPath } from "../../src/cli/translate-json-run.js";

describe("expandJsonBlockOutputPath", () => {
  const root = "/proj";

  it("expands {llocale} as lowercased locale", () => {
    const out = expandJsonBlockOutputPath(
      "src/i18n/{llocale}/translation.json",
      root,
      "pt-BR",
      "src/i18n/en/translation.json"
    );
    expect(out).toBe(path.join(root, "src/i18n/pt-br/translation.json"));
  });

  it("expands {LOCALE} as uppercased locale", () => {
    const out = expandJsonBlockOutputPath(
      "out/{LOCALE}/{basename}",
      root,
      "pt-BR",
      "src/i18n/en/translation.json"
    );
    expect(out).toBe(path.join(root, "out/PT-BR/translation.json"));
  });

  it("keeps {locale} as config BCP-47 form", () => {
    const out = expandJsonBlockOutputPath(
      "src/i18n/{locale}/translation.json",
      root,
      "pt-BR",
      "src/i18n/en/translation.json"
    );
    expect(out).toBe(path.join(root, "src/i18n/pt-BR/translation.json"));
  });
});
