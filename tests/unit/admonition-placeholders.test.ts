import { describe, expect, it } from "vitest";
import {
  protectAdmonitionSyntax,
  restoreAdmonitionSyntax,
} from "../../src/processors/admonition-placeholders.js";

describe("admonition-placeholders", () => {
  it("protects Docusaurus-style directives and restores", () => {
    const src = `:::note Title\nBody\n:::`;
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap.length).toBeGreaterThan(0);
    expect(p.endMap.length).toBeGreaterThan(0);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap)).toBe(src);
  });

  it("masks only the directive prefix on the opener line so title text remains on that line", () => {
    const src = `:::note Title text\nBody\n:::`;
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::note "]);
    expect(p.protected).toBe(`{{ADM_OPEN_0}}Title text\nBody\n{{ADM_END_0}}`);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("exposes bracketed-title text for translation while protecting the brackets", () => {
    const src = ":::note[Your Title **with** _md_ `code`]\nBody\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::note["]);
    expect(p.titleCloseMap).toEqual(["]"]);
    expect(p.protected).toBe(
      "{{ADM_OPEN_0}}Your Title **with** _md_ `code`{{ADM_TCLOSE_0}}\nBody\n{{ADM_END_0}}"
    );
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("protects trailing attributes after a bracketed title", () => {
    const src = ":::tip[Pro tip]{.text--italic #my-tip}\nBody\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::tip["]);
    expect(p.titleCloseMap).toEqual(["]{.text--italic #my-tip}"]);
    expect(p.protected).toBe("{{ADM_OPEN_0}}Pro tip{{ADM_TCLOSE_0}}\nBody\n{{ADM_END_0}}");
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("round-trips nested admonitions with preserved colon counts and titles", () => {
    const src = [
      ":::::info[Parent]",
      "Parent body",
      "::::danger[Child]",
      "Child body",
      ":::tip[Deep Child]",
      "Deep body",
      ":::",
      "::::",
      ":::::",
    ].join("\n");
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::::info[", "::::danger[", ":::tip["]);
    expect(p.endMap).toEqual([":::", "::::", ":::::"]);
    expect(p.titleCloseMap).toEqual(["]", "]", "]"]);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("protects GitHub alert syntax line", () => {
    const src = "> [!NOTE]\n> body";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap.some((l) => l.includes("[!NOTE]"))).toBe(true);
    const back = restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap);
    expect(back).toContain("[!NOTE]");
  });

  it("handles multiple closing colons variants", () => {
    const src = ":::tip\nx\n::::";
    const p = protectAdmonitionSyntax(src);
    expect(p.endMap.length).toBeGreaterThan(0);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap)).toBe(src);
  });
});
