import { describe, expect, it } from "vitest";
import { extractQtUiCalls, isQtUiFile } from "../../src/extractors/qt-ui-extractor.js";

describe("isQtUiFile", () => {
  it("matches .ui extensions case-insensitively", () => {
    expect(isQtUiFile("forms/main.ui")).toBe(true);
    expect(isQtUiFile("forms/Main.UI")).toBe(true);
    expect(isQtUiFile("forms/main.py")).toBe(false);
  });
});

describe("extractQtUiCalls", () => {
  it("skips empty strings, notr, and decodes XML entities", () => {
    const xml = [
      `<ui version="4.0">`,
      `<string></string>`,
      `<string>   </string>`,
      `<string notr="true">Skip</string>`,
      `<string comment='menu'>File &amp; Edit</string>`,
      `<string>&lt;Save&gt; &quot;now&quot; &apos;please&apos;</string>`,
      `<string><![CDATA[Raw <text>]]></string>`,
      `<string>Code &#65; and &#x42;</string>`,
      `</ui>`,
    ].join("\n");
    const calls = extractQtUiCalls(xml, "forms\\dialog.ui");
    expect(calls.map((call) => call.literal)).toEqual([
      "File & Edit",
      "<Save> \"now\" 'please'",
      "Raw <text>",
      "Code A and B",
    ]);
    expect(calls[0]?.context).toBe("menu");
    expect(calls[0]?.file).toBe("forms/dialog.ui");
    expect(calls[0]?.line).toBe(5);
  });
});
