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
