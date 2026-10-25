import { describe, expect, it } from "vitest";
import { isCodeFenceClose, matchCodeFenceOpen } from "../../src/processors/code-fence.js";

describe("matchCodeFenceOpen", () => {
  it("returns the fence char and run length", () => {
    expect(matchCodeFenceOpen("```python")).toEqual({ char: "`", length: 3 });
    expect(matchCodeFenceOpen("  ````")).toEqual({ char: "`", length: 4 });
    expect(matchCodeFenceOpen("~~~~~")).toEqual({ char: "~", length: 5 });
  });

  it("returns null for non-fence lines", () => {
    expect(matchCodeFenceOpen("``not a fence``")).toBeNull();
    expect(matchCodeFenceOpen("plain text")).toBeNull();
  });
});

describe("isCodeFenceClose", () => {
  it("closes on the same char with an equal or longer run", () => {
    expect(isCodeFenceClose("```", { char: "`", length: 3 })).toBe(true);
    expect(isCodeFenceClose("`````", { char: "`", length: 4 })).toBe(true);
    expect(isCodeFenceClose("~~~", { char: "~", length: 3 })).toBe(true);
  });

  it("does not close a longer fence with a shorter run", () => {
    expect(isCodeFenceClose("```", { char: "`", length: 4 })).toBe(false);
  });

  it("does not close on a different fence char", () => {
    expect(isCodeFenceClose("~~~", { char: "`", length: 3 })).toBe(false);
  });

  it("does not close on a line with an info string", () => {
    expect(isCodeFenceClose("```python", { char: "`", length: 3 })).toBe(false);
  });

  it("allows trailing whitespace on a closing fence", () => {
    expect(isCodeFenceClose("```   ", { char: "`", length: 3 })).toBe(true);
  });
});
