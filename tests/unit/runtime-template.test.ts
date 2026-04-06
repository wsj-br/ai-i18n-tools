import { flipUiArrowsForRtl, interpolateTemplate } from "../../src/runtime/template";

describe("interpolateTemplate", () => {
  it("replaces {{key}} with string values", () => {
    expect(interpolateTemplate("Hello {{name}}", { name: "Ada" })).toBe("Hello Ada");
  });

  it("coerces numbers and booleans", () => {
    expect(interpolateTemplate("n={{n}} b={{b}}", { n: 3, b: true })).toBe("n=3 b=true");
  });

  it("uses empty string for missing keys", () => {
    expect(interpolateTemplate("x={{x}}", {})).toBe("x=");
  });

  it("only matches word keys like Transrewrt", () => {
    expect(interpolateTemplate("{{a}} {{b2}}", { a: "1", b2: "2" })).toBe("1 2");
  });
});

describe("flipUiArrowsForRtl", () => {
  it("returns unchanged when not RTL", () => {
    expect(flipUiArrowsForRtl("a → b", false)).toBe("a → b");
  });

  it("flips arrow when RTL", () => {
    expect(flipUiArrowsForRtl("a → b", true)).toBe("a ← b");
  });

  it("passes through nullish when not RTL", () => {
    expect(flipUiArrowsForRtl(undefined, false)).toBeUndefined();
    expect(flipUiArrowsForRtl(null, false)).toBeNull();
  });

  it("passes through nullish when RTL", () => {
    expect(flipUiArrowsForRtl(undefined, true)).toBeUndefined();
    expect(flipUiArrowsForRtl(null, true)).toBeNull();
  });
});
