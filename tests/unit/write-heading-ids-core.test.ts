import { describe, expect, it } from "vitest";
import {
  applyHeadingAnchorsToMarkdown,
  defaultPymdownOptions,
  injectHtmlHeadingAnchors,
  slugAzureDevOps,
  slugPymdown,
  type SlugContext,
} from "../../src/markdown/write-heading-ids-core.js";

function ctx(style: SlugContext["style"]): SlugContext {
  if (style === "pymdown") {
    return { style, counts: new Map(), pymdown: defaultPymdownOptions() };
  }
  return { style, counts: new Map() };
}

describe("injectHtmlHeadingAnchors", () => {
  it("inserts a line with <a id= before each ATX heading (github)", () => {
    const input = "## Table of Contents\n\n## Next\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toBe(
      '<a id="table-of-contents"></a>\n## Table of Contents\n\n<a id="next"></a>\n## Next\n'
    );
  });

  it("does not append {#slug} to heading lines", () => {
    const input = "## Hello\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).not.toContain("{#");
    expect(out).toMatch(/^<a id="/);
  });

  it("skips headings inside fenced code blocks", () => {
    const input = "```\n## Not a heading\n```\n\n## Real\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).not.toContain('<a id="not-a-heading"');
    expect(out).toContain('<a id="real"></a>');
  });

  it("skips when the previous line is already an HTML id anchor", () => {
    const input = '<a id="manual"></a>\n## Already\n';
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toBe(input);
  });

  it("skips headings that already contain {#custom-id}", () => {
    const input = "## Doc {#custom-id}\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toBe(input);
  });

  it("matches anchor-markdown-header github slug for Jack & Jill", () => {
    const input = "## Jack & Jill\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toContain('<a id="jack--jill"></a>');
  });

  it("disambiguates duplicate titles with -1 (github)", () => {
    const input = "## Hello\n\n## Hello\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toContain('<a id="hello"></a>');
    expect(out).toContain('<a id="hello-1"></a>');
  });

  it("uses markdown-header prefix and _1 for bitbucket style", () => {
    const input = "## Hello\n\n## Hello\n";
    const out = injectHtmlHeadingAnchors(input, ctx("bitbucket"));
    expect(out).toContain('<a id="markdown-header-hello"></a>');
    expect(out).toContain('<a id="markdown-header-hello_1"></a>');
  });

  it("gitlab style: intro slug", () => {
    const input = "## Intro\n";
    const out = injectHtmlHeadingAnchors(input, ctx("gitlab"));
    expect(out).toContain('<a id="intro"></a>');
  });

  it("azure-devops style inserts a percent-encoded or safe id", () => {
    const input = "## Section A\n";
    const out = injectHtmlHeadingAnchors(input, ctx("azure-devops"));
    expect(out).toMatch(/<a id="section-a"><\/a>\n## Section A/);
  });

  it("pymdown style with default options", () => {
    const input = "## My Section\n";
    const out = injectHtmlHeadingAnchors(input, ctx("pymdown"));
    expect(out).toContain("<a id=");
    expect(out).toContain("## My Section");
  });

  it("respects ~~~ fenced blocks", () => {
    const input = "~~~\n## Fake\n~~~\n\n## Real\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).not.toContain('<a id="fake"');
    expect(out).toContain('<a id="real"></a>');
  });

  it("pymdown custom options (title case, no percent encode)", () => {
    const input = "## Hello World\n";
    const out = injectHtmlHeadingAnchors(input, {
      style: "pymdown",
      pymdown: { case: "title", normalize: "nfc", percentEncode: false },
      counts: new Map(),
    });
    expect(out).toMatch(/<a id="Hello-World"><\/a>/);
  });

  it("pymdown case none and normalize nfd", () => {
    const input = "## café\n";
    const out = injectHtmlHeadingAnchors(input, {
      style: "pymdown",
      pymdown: { case: "none", normalize: "nfd", percentEncode: true },
      counts: new Map(),
    });
    expect(out).toContain("<a id=");
    expect(out).toContain("## café");
  });
});

describe("slug helpers", () => {
  it("slugAzureDevOps adds repetition suffix", () => {
    expect(slugAzureDevOps("Section", 1)).toContain("-1");
  });

  it("slugPymdown percent-encodes when requested", () => {
    const id = slugPymdown("café", 0, {
      case: "lower",
      normalize: "nfc",
      percentEncode: true,
    });
    expect(id.startsWith("%")).toBe(true);
  });
});

describe("applyHeadingAnchorsToMarkdown", () => {
  it("returns original markdown when body has no headings", () => {
    const md = "plain paragraph\n";
    expect(applyHeadingAnchorsToMarkdown(md, "github")).toBe(md);
  });

  it("preserves YAML front matter", () => {
    const md = `---
title: T
---

## Body
`;
    const out = applyHeadingAnchorsToMarkdown(md, "github");
    expect(out.startsWith("---\ntitle: T\n---\n\n")).toBe(true);
    expect(out).toContain('<a id="body"></a>');
  });
});
