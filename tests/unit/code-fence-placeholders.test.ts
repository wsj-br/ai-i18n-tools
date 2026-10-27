import { describe, expect, it } from "vitest";
import {
  protectFencedCodeBlocks,
  restoreFencedCodeBlocks,
} from "../../src/processors/code-fence-placeholders.js";

describe("protectFencedCodeBlocks", () => {
  it("replaces a closed fence, including its info string, with one token", () => {
    const src = '```js [Prepared source]\nt("Save changes");\n```';
    const protectedResult = protectFencedCodeBlocks(src);
    expect(protectedResult.protected).toBe("{{CDF_0}}");
    expect(protectedResult.codeFenceMap).toEqual([src]);
    expect(restoreFencedCodeBlocks(protectedResult.protected, protectedResult.codeFenceMap)).toBe(
      src
    );
  });

  it("keeps a nested 3-backtick fence inside a 4-backtick fence as one block", () => {
    const src = "````md\n```js\ncode\n```\n````";
    const protectedResult = protectFencedCodeBlocks(src);
    expect(protectedResult.codeFenceMap).toEqual([src]);
    expect(protectedResult.protected).toBe("{{CDF_0}}");
  });

  it("leaves an unclosed opener in place", () => {
    const src = "```js\nconst x = 1;\n\n:::";
    const protectedResult = protectFencedCodeBlocks(src);
    expect(protectedResult.codeFenceMap).toEqual([]);
    expect(protectedResult.protected).toBe(src);
  });

  it("restores a token the model spaced out", () => {
    expect(restoreFencedCodeBlocks("{{ CDF_0 }}", ["```\ncode\n```"])).toBe("```\ncode\n```");
  });
});
