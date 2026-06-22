import { describe, expect, it } from "vitest";
import {
  calleeMatchesTranslatedFunc,
  extractInterpolationNames,
  extractUiCallsFromAstroSource,
  extractUiCallsFromFileContent,
  extractUiCallsFromSource,
  isAstroUiSourceFile,
  pluralMultiPlaceholderMissingCount,
  sliceAstroSource,
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

  it("captures a template literal with no interpolation", () => {
    const src = "const x = t(`Line one\nLine two`);";
    const calls = extractUiCallsFromSource(src, "x.ts", ["t"]);
    expect(calls.some((c) => c.literal === "Line one\nLine two")).toBe(true);
  });

  it("ignores template literals that interpolate expressions", () => {
    const src = "const x = t(`Hello ${name}`);";
    const calls = extractUiCallsFromSource(src, "x.ts", ["t"]);
    expect(calls.length).toBe(0);
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

describe("sliceAstroSource / extractUiCallsFromAstroSource", () => {
  it("extracts t() from frontmatter", () => {
    const astro = `---
import { t } from '../i18n/t';
const label = t('Hello from frontmatter');
---
<h1>Static</h1>`;
    const calls = extractUiCallsFromAstroSource(astro, "page.astro", ["t"]);
    expect(calls.some((c) => c.literal === "Hello from frontmatter")).toBe(true);
    expect(calls[0]?.line).toBe(3);
  });

  it("extracts t() from template expressions", () => {
    const astro = `---
const x = 1;
---
<nav><a href="#">{t('Features')}</a></nav>`;
    const calls = extractUiCallsFromAstroSource(astro, "nav.astro", ["t"]);
    expect(calls.some((c) => c.literal === "Features")).toBe(true);
    expect(calls.find((c) => c.literal === "Features")?.line).toBe(4);
  });

  it("skips style blocks and inline scripts", () => {
    const astro = `---
t('Keep me');
---
<style>.x { color: t('drop'); }</style>
<script is:inline>t('drop');</script>
<p>{t('Visible')}</p>`;
    const calls = extractUiCallsFromAstroSource(astro, "x.astro", ["t"]);
    expect(calls.map((c) => c.literal).sort()).toEqual(["Keep me", "Visible"]);
  });

  it("routes extractUiCallsFromFileContent by extension", () => {
    const src = `t('In TS');`;
    expect(extractUiCallsFromFileContent(src, "a.ts", ["t"])[0]?.literal).toBe("In TS");
    const astro = `---\nt('In Astro');\n---\n`;
    expect(extractUiCallsFromFileContent(astro, "a.astro", ["t"])[0]?.literal).toBe("In Astro");
  });

  it("isAstroUiSourceFile matches .astro only", () => {
    expect(isAstroUiSourceFile("x.astro")).toBe(true);
    expect(isAstroUiSourceFile("x.ASTRO")).toBe(true);
    expect(isAstroUiSourceFile("x.ts")).toBe(false);
  });

  it("sliceAstroSource preserves line count", () => {
    const astro = "---\nt('a');\n---\n<p>{t('b')}</p>";
    expect(sliceAstroSource(astro).split("\n")).toHaveLength(4);
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
