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

  it("matches nested member callee like i18n.t", () => {
    const callee = {
      type: "MemberExpression",
      object: { type: "Identifier", name: "i18n" },
      property: { type: "Identifier", name: "t" },
      computed: false,
    } as Expression;
    expect(calleeMatchesTranslatedFunc(callee, ["i18n.t"])).toBe(true);
  });

  it("does not match when middle link breaks member chain", () => {
    const callee = {
      type: "MemberExpression",
      object: { type: "Identifier", name: "x" },
      property: { type: "Identifier", name: "t" },
      computed: false,
    } as Expression;
    expect(calleeMatchesTranslatedFunc(callee, ["app.i18n.t"])).toBe(false);
  });
});

describe("extractUiCallsFromSource edge cases", () => {
  it("returns empty array when parse fails completely", () => {
    expect(extractUiCallsFromSource("export default <<<<<", "bad.ts", ["t"])).toEqual([]);
  });

  it("does not collect calls whose first argument is not a string literal", () => {
    const src = `import { t } from 'x'; const k='Hi'; t(k);`;
    expect(extractUiCallsFromSource(src, "x.ts", ["t"])).toEqual([]);
  });
});
