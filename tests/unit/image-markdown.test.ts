import { describe, expect, it } from "vitest";
import {
  formatImageMarkdown,
  hasTranslatableImageAlt,
  imageAltTranslationErrors,
  parseStandaloneImageMarkdown,
} from "../../src/extractors/image-markdown.js";

describe("image-markdown", () => {
  it("parses standalone image markdown", () => {
    expect(parseStandaloneImageMarkdown("![Alt text](/path.png)")).toEqual({
      alt: "Alt text",
      url: "/path.png",
    });
  });

  it("returns null for inline image in prose", () => {
    expect(parseStandaloneImageMarkdown("Text ![Alt](u) more")).toBeNull();
  });

  it("formats image markdown from alt and url", () => {
    expect(formatImageMarkdown("Alt", "/x.png")).toBe("![Alt](/x.png)");
  });

  it("detects translatable alt text", () => {
    expect(hasTranslatableImageAlt("Screenshot")).toBe(true);
    expect(hasTranslatableImageAlt("")).toBe(false);
  });

  it("flags markdown leaks in translated alt", () => {
    expect(imageAltTranslationErrors("Plain alt")).toEqual([]);
    expect(imageAltTranslationErrors("![bad](u)")).toHaveLength(1);
    expect(imageAltTranslationErrors("{{URL_0}}")).toHaveLength(1);
  });
});
