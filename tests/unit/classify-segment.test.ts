import { classifySegmentType } from "../../src/extractors/classify-segment.js";

describe("classifySegmentType", () => {
  it.each([
    ["# heading", "heading"],
    ["## sub", "heading"],
    ["  ### spaced ", "heading"],
    ["![alt](url)", "other"],
    ["import x from 'y'", "other"],
    ["<Component />", "other"],
    ["Plain text.", "paragraph"],
    ["", "paragraph"],
  ])("classifies %p as %s", (text, expected) => {
    expect(classifySegmentType(text)).toBe(expected);
  });
});
