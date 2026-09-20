import { describe, expect, it } from "vitest";
import {
  reattachHeadingIdSuffixes,
  stripHeadingIdSuffixes,
} from "../../src/processors/heading-id-suffix-placeholders.js";

describe("stripHeadingIdSuffixes / reattachHeadingIdSuffixes", () => {
  it("round-trips a classic `{#id}` suffix", () => {
    const src = "## Hello {#hello}";
    const stripped = stripHeadingIdSuffixes(src);
    expect(stripped.text).toBe("## Hello");
    expect(stripped.headingIdSuffixes).toEqual(["{#hello}"]);
    expect(reattachHeadingIdSuffixes(stripped.text, stripped.headingIdSuffixes)).toBe(src);
  });

  it("round-trips an MDX `{/* #id */}` suffix", () => {
    const src = "### Hello World {/* #my-explicit-id */}";
    const stripped = stripHeadingIdSuffixes(src);
    expect(stripped.text).toBe("### Hello World");
    expect(stripped.headingIdSuffixes).toEqual(["{/* #my-explicit-id */}"]);
    expect(reattachHeadingIdSuffixes(stripped.text, stripped.headingIdSuffixes)).toBe(src);
  });

  it("handles multiple headings in one body", () => {
    const src = ["# Welcome {#welcome}", "", "## Next {/* #next */}", "", "body"].join("\n");
    const stripped = stripHeadingIdSuffixes(src);
    expect(stripped.text).toBe(["# Welcome", "", "## Next", "", "body"].join("\n"));
    expect(stripped.headingIdSuffixes).toEqual(["{#welcome}", "{/* #next */}"]);
    expect(reattachHeadingIdSuffixes(stripped.text, stripped.headingIdSuffixes)).toBe(src);
  });

  it("is a no-op when there is no suffix or no heading", () => {
    expect(stripHeadingIdSuffixes("plain paragraph")).toEqual({
      text: "plain paragraph",
      headingIdSuffixes: [],
    });
    expect(stripHeadingIdSuffixes("## Plain heading")).toEqual({
      text: "## Plain heading",
      headingIdSuffixes: [],
    });
    expect(reattachHeadingIdSuffixes("## Plain heading", [])).toBe("## Plain heading");
  });

  it("leaves a mid-heading `{/* #id */}` untouched", () => {
    const src = "## Foo {/* #id */} bar";
    const stripped = stripHeadingIdSuffixes(src);
    expect(stripped.headingIdSuffixes).toEqual([]);
    expect(stripped.text).toBe(src);
  });

  it("leaves a mid-heading `{#id}` untouched", () => {
    const src = "### Step {#my-id} and more";
    const stripped = stripHeadingIdSuffixes(src);
    expect(stripped.headingIdSuffixes).toEqual([]);
    expect(stripped.text).toBe(src);
  });

  it("pins the suffix to end of line even when translated words reorder", () => {
    const stripped = stripHeadingIdSuffixes(
      "## HTTPS with a reverse proxy {/* #https-with-a-reverse-proxy */}"
    );
    const restored = reattachHeadingIdSuffixes(
      "## रिवर्स प्रॉक्सी के साथ HTTPS",
      stripped.headingIdSuffixes
    );
    expect(restored).toBe("## रिवर्स प्रॉक्सी के साथ HTTPS {/* #https-with-a-reverse-proxy */}");
  });
});
