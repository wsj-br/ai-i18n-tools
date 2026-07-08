import { describe, expect, it } from "vitest";
import {
  displayWidth,
  padEndDisplay,
  padStartDisplay,
  renderTable,
} from "../../src/utils/table.js";

describe("displayWidth", () => {
  it("counts ASCII as one column each", () => {
    expect(displayWidth("Code")).toBe(4);
  });

  it("counts CJK as two columns each", () => {
    expect(displayWidth("日本語")).toBe(6);
  });

  it("ignores zero-width joiners and variation selectors", () => {
    expect(displayWidth("a\u200db")).toBe(2);
  });
});

describe("padEndDisplay / padStartDisplay", () => {
  it("pads ASCII to the target display width", () => {
    expect(padEndDisplay("ab", 5)).toBe("ab   ");
    expect(padStartDisplay("ab", 5)).toBe("   ab");
  });

  it("accounts for wide glyphs when padding", () => {
    // "語" is 2 columns wide, so only one trailing space is needed to reach width 3.
    expect(padEndDisplay("語", 3)).toBe("語 ");
  });

  it("never truncates when content exceeds the width", () => {
    expect(padEndDisplay("toolong", 3)).toBe("toolong");
  });
});

describe("renderTable", () => {
  it("aligns columns by display width", () => {
    const lines = renderTable({
      headers: ["Code", "Name"],
      rows: [
        ["de", "German"],
        ["zh-Hans", "中文"],
      ],
    });
    expect(lines[0]).toBe("  Code     Name");
    expect(lines[1]).toBe("  -------  ------");
    expect(lines[2]).toBe("  de       German");
    expect(lines[3]).toBe("  zh-Hans  中文");
  });

  it("supports right alignment", () => {
    const lines = renderTable({
      headers: ["N"],
      rows: [["10"], ["1"]],
      align: ["right"],
      rule: false,
    });
    expect(lines).toEqual(["   N", "  10", "   1"]);
  });

  it("inserts a rule line before listed row indices", () => {
    const lines = renderTable({
      headers: ["Model", "Cost"],
      rows: [
        ["a", "1"],
        ["TOTAL", "3"],
      ],
      align: ["left", "right"],
      separatorBeforeRows: [1],
    });
    expect(lines).toEqual([
      "  Model  Cost",
      "  -----  ----",
      "  a         1",
      "  -----  ----",
      "  TOTAL     3",
    ]);
  });
});
