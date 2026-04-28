import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "../scripts/lib/decode-html-entities-ui-languages.mjs";

describe("decodeHtmlEntities (UI languages wiki scrape)", () => {
  it("decodes &amp;#160; to NBSP (ampersand must peel before numeric)", () => {
    expect(decodeHtmlEntities("&amp;#160;")).toBe("\u00A0");
  });

  it("decodes double-escaped &amp;amp;#160; to NBSP", () => {
    expect(decodeHtmlEntities("&amp;amp;#160;")).toBe("\u00A0");
  });

  it("still decodes bare &#160;", () => {
    expect(decodeHtmlEntities("&#160;")).toBe("\u00A0");
  });

  it("still decodes &lt; after amp peel order", () => {
    expect(decodeHtmlEntities("&amp;lt;")).toBe("<");
  });

  it("runs another pass when numeric decode exposes &amp;", () => {
    expect(decodeHtmlEntities("&#38;amp;")).toBe("&");
  });
});
