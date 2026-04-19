import { describe, expect, it } from "vitest";
import {
  calleeMatchesTranslatedFunc,
  extractInterpolationNames,
  extractUiCallsFromSource,
  pluralMultiPlaceholderMissingCount,
} from "../../src/extractors/ui-string-babel.js";
import type { Expression } from "@babel/types";

describe("extractUiCallsFromSource", () => {
  it("captures plurals and zeroDigit from options object", () => {
    const src = `
      import { t } from 'i18next';
      t('{{count}} items', { plurals: true, zeroDigit: true });
    `;
    const calls = extractUiCallsFromSource(src, "a.tsx", ["t"]);
    expect(calls.length).toBe(1);
    expect(calls[0]?.literal).toBe("{{count}} items");
    expect(calls[0]?.plurals).toBe(true);
    expect(calls[0]?.zeroDigit).toBe(true);
  });

  it("captures i18n.t member call", () => {
    const src = `import i18n from './i18n'; i18n.t("Hello");`;
    const calls = extractUiCallsFromSource(src, "x.ts", ["t", "i18n.t"]);
    expect(calls.some((c) => c.literal === "Hello")).toBe(true);
  });
});

describe("pluralMultiPlaceholderMissingCount", () => {
  it("returns false for single placeholder", () => {
    expect(pluralMultiPlaceholderMissingCount("{{count}} x")).toBe(false);
  });

  it("returns true when multiple placeholders lack count", () => {
    expect(pluralMultiPlaceholderMissingCount("Hello {{name}}, {{msgs}} msgs")).toBe(true);
  });

  it("returns false when multiple placeholders include count", () => {
    expect(pluralMultiPlaceholderMissingCount("Hello {{name}}, {{count}} msgs")).toBe(false);
  });
});

describe("extractInterpolationNames", () => {
  it("lists unique-ish names", () => {
    expect(extractInterpolationNames("A {{x}} B {{y}}")).toEqual(["x", "y"]);
  });
});

describe("calleeMatchesTranslatedFunc", () => {
  it("matches Identifier", () => {
    const callee = { type: "Identifier", name: "t" } as Expression;
    expect(calleeMatchesTranslatedFunc(callee, ["t"])).toBe(true);
  });
});
