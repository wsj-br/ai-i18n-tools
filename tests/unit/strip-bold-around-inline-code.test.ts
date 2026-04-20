import { describe, expect, it } from "vitest";
import { stripBoldAroundInlineCode } from "../../src/utils/stripBoldAroundInlineCode.js";

describe("stripBoldAroundInlineCode", () => {
  it("strips bold around simple inline code", () => {
    expect(stripBoldAroundInlineCode("before **`foo`** after")).toBe("before `foo` after");
  });

  it("does not strip monospace `**` span (first * preceded by backtick)", () => {
    expect(stripBoldAroundInlineCode("see `**` token")).toBe("see `**` token");
  });

  it("handles template-literal-heavy inline code ending before **", () => {
    const s =
      'dynamic **`import(\\`./locales/${x}.json\\`)`**, **`fetch`**';
    expect(stripBoldAroundInlineCode(s)).toBe(
      'dynamic `import(\\`./locales/${x}.json\\`)`, `fetch`'
    );
  });

  it("handles adjacent spans", () => {
    expect(stripBoldAroundInlineCode("`a` **`b`** **`c`**")).toBe("`a` `b` `c`");
  });
});
