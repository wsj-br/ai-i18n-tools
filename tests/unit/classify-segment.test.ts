import { describe, expect, it } from "vitest";
import { classifySegmentType } from "../../src/extractors/classify-segment.js";

describe("classifySegmentType", () => {
  it.each([
    ["# heading", "heading"],
    ["## sub", "heading"],
    ["  ### spaced ", "heading"],
    ["![alt](url)", "image"],
    ["import x from 'y'", "other"],
    ["export const X = 1", "other"],
    ["<Component />", "paragraph"],
    ["Plain text.", "paragraph"],
    ["", "paragraph"],
  ])("classifies %p as %s", (text, expected) => {
    expect(classifySegmentType(text)).toBe(expected);
  });
});
