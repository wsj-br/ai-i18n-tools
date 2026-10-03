import { describe, expect, it } from "vitest";
import { mkdocsAdmonitionEndIndex } from "../../src/processors/admonition-syntax.js";

describe("mkdocsAdmonitionEndIndex", () => {
  it("keeps a blank line inside the block when the next line is still indented", () => {
    const lines = ["!!! note", "    line one", "", "    line two", "plain"];
    expect(mkdocsAdmonitionEndIndex(lines, 0)).toBe(3);
  });

  it("ends before a line that is not indented enough", () => {
    const lines = ["!!! note", "    body", "not indented"];
    expect(mkdocsAdmonitionEndIndex(lines, 0)).toBe(1);
  });
});
