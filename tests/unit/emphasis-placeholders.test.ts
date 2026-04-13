import {
  protectMarkdownEmphasis,
  restoreMarkdownEmphasis,
} from "../../src/processors/emphasis-placeholders.js";

describe("emphasis placeholders", () => {
  it("round-trips emphasis, strong, combined emphasis, and strikethrough", () => {
    const src = [
      "Use *asterisks* or _underscores_.",
      "Strong: **asterisks** and __underscores__.",
      "Combined: **asterisks and _underscores_**.",
      "Strike: ~~Scratch this.~~",
    ].join("\n");

    const protectedState = protectMarkdownEmphasis(src);
    expect(protectedState.protected).toContain("{{IT}}");
    expect(protectedState.protected).toContain("{{IU}}");
    expect(protectedState.protected).toContain("{{SE}}");
    expect(protectedState.protected).toContain("{{SU}}");
    expect(protectedState.protected).toContain("{{ST}}");

    const restored = restoreMarkdownEmphasis(protectedState.protected);
    expect(restored).toBe(src);
  });

  it("does not replace markers inside code spans", () => {
    const src = "Code: `**not bold** _not italic_ ~~not strike~~` and *yes italic*.";
    const protectedState = protectMarkdownEmphasis(src);
    expect(protectedState.protected).toContain("`**not bold** _not italic_ ~~not strike~~`");

    const restored = restoreMarkdownEmphasis(protectedState.protected);
    expect(restored).toBe(src);
  });

  it("ignores escaped delimiter markers", () => {
    const src = String.raw`Escaped: \*no italic\* and \~~no strike\~~ and **yes bold**.`;
    const protectedState = protectMarkdownEmphasis(src);

    const restored = restoreMarkdownEmphasis(protectedState.protected);
    expect(restored).toBe(src);
  });
});
