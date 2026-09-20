import { describe, expect, it } from "vitest";
import {
  applyHeadingAnchorsToMarkdown,
  applyKnownHeadingIds,
  defaultPymdownOptions,
  extractHeadingIds,
  injectHtmlHeadingAnchors,
  parseExplicitHeadingId,
  slugAzureDevOps,
  slugPymdown,
  stripHeadingIds,
  stripHeadingIdsAnywhere,
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

  it("leaves unchanged when the preceding HTML anchor id matches the heading", () => {
    const input = '<a id="already"></a>\n## Already\n';
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toBe(input);
  });

  it("updates the preceding HTML anchor when the heading text changed", () => {
    const input = '<a id="design-for-i18n-from-the-start"></a>\n## Plan for i18n early\n';
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toBe('<a id="plan-for-i18n-early"></a>\n## Plan for i18n early\n');
  });

  it("replaces a classic {#custom-id} suffix with an HTML anchor for github style", () => {
    const input = "## Doc {#custom-id}\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toBe('<a id="doc"></a>\n## Doc\n');
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

  it("replaces an MDX comment id with an HTML anchor for github style", () => {
    const input = "## Doc {/* #custom-id */}\n";
    const out = injectHtmlHeadingAnchors(input, ctx("github"));
    expect(out).toBe('<a id="doc"></a>\n## Doc\n');
  });
});

describe("injectHtmlHeadingAnchors mdx-comment", () => {
  it("appends {/* #slug */} using the github slug algorithm", () => {
    const input = "## Notifications not working\n\n## Next\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).toBe(
      "## Notifications not working {/* #notifications-not-working */}\n\n## Next {/* #next */}\n"
    );
  });

  it("does not insert an HTML anchor line", () => {
    const input = "## Hello\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).not.toContain("<a id=");
    expect(out).toBe("## Hello {/* #hello */}\n");
  });

  it("skips headings inside fenced code blocks", () => {
    const input = "```\n## Not a heading\n```\n\n## Real\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).not.toContain("{/* #not-a-heading */}");
    expect(out).toContain("## Real {/* #real */}");
  });

  it("leaves unchanged when the MDX comment id matches the heading", () => {
    const input = "## Already {/* #already */}\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).toBe(input);
  });

  it("updates a stale MDX comment when the heading text changed", () => {
    const input = "## Plan for i18n early {/* #design-for-i18n-from-the-start */}\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).toBe("## Plan for i18n early {/* #plan-for-i18n-early */}\n");
  });

  it("converts classic {#id} to an MDX comment using the heading slug", () => {
    const input = "# Welcome to duplistatus {#welcome-to-duplistatus}\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).toBe("# Welcome to duplistatus {/* #welcome-to-duplistatus */}\n");
  });

  it("replaces a custom classic id with the slug from heading text", () => {
    const input = "## TLS configuration {#tls-setup}\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).toBe("## TLS configuration {/* #tls-configuration */}\n");
  });

  it("drops a preceding HTML anchor when writing mdx-comment", () => {
    const input = '<a id="old"></a>\n## Hello\n';
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).toBe("## Hello {/* #hello */}\n");
  });

  it("disambiguates duplicate titles with -1", () => {
    const input = "## Hello\n\n## Hello\n";
    const out = injectHtmlHeadingAnchors(input, ctx("mdx-comment"));
    expect(out).toContain("## Hello {/* #hello */}");
    expect(out).toContain("## Hello {/* #hello-1 */}");
  });

  it("preserves YAML front matter via applyHeadingAnchorsToMarkdown", () => {
    const md = `---
title: T
---

## Body
`;
    const out = applyHeadingAnchorsToMarkdown(md, "mdx-comment");
    expect(out.startsWith("---\ntitle: T\n---\n\n")).toBe(true);
    expect(out).toContain("## Body {/* #body */}");
    expect(out).not.toContain("<a id=");
  });
});

describe("parseExplicitHeadingId", () => {
  it("parses classic and mdx-comment suffixes", () => {
    expect(parseExplicitHeadingId("Hello {#x}")).toEqual({
      text: "Hello",
      id: "x",
      kind: "classic",
    });
    expect(parseExplicitHeadingId("Hello {/* #notifications-not-working */}")).toEqual({
      text: "Hello",
      id: "notifications-not-working",
      kind: "mdx-comment",
    });
    expect(parseExplicitHeadingId("Plain")).toEqual({ text: "Plain" });
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

  it("strips heading ids when remove is true", () => {
    const md = `---
title: T
---

<a id="body"></a>
## Body {/* #body */}
`;
    const out = applyHeadingAnchorsToMarkdown(md, "github", undefined, true);
    expect(out).toContain("## Body");
    expect(out).not.toContain("<a id=");
    expect(out).not.toContain("{/*");
  });
});

describe("extractHeadingIds", () => {
  it("returns explicit ids in document order and undefined when absent", () => {
    const input = [
      "# Welcome {/* #welcome */}",
      "",
      "## Next {#next}",
      "",
      "## No id",
      "",
      "```",
      "## Not a heading {/* #inside */}",
      "```",
      "",
    ].join("\n");
    expect(extractHeadingIds(input)).toEqual(["welcome", "next", undefined]);
  });
});

describe("applyKnownHeadingIds", () => {
  it("repairs a mid-heading MDX comment using the known English id", () => {
    const input = "## रिवर्स प्रॉक्सी {/* #https-with-a-reverse-proxy */} के साथ HTTPS\n";
    const out = applyKnownHeadingIds(input, ["https-with-a-reverse-proxy"], "mdx-comment");
    expect(out).toBe("## रिवर्स प्रॉक्सी के साथ HTTPS {/* #https-with-a-reverse-proxy */}\n");
  });

  it("replaces an embedded wrong id with the known id at line end", () => {
    const input = "## Foo {/* #wrong-position */} bar\n";
    const out = applyKnownHeadingIds(input, ["correct-id"], "mdx-comment");
    expect(out).toBe("## Foo bar {/* #correct-id */}\n");
  });

  it("writes HTML anchors from known ids and leaves extra headings untouched", () => {
    const input = "## One\n\n## Two\n";
    const out = applyKnownHeadingIds(input, ["one", undefined], "github");
    expect(out).toBe('<a id="one"></a>\n## One\n\n## Two\n');
  });

  it("skips headings inside fenced code blocks", () => {
    const input = "```\n## Not {#inside}\n```\n\n## Real\n";
    const out = applyKnownHeadingIds(input, ["real"], "mdx-comment");
    expect(out).toContain("## Not {#inside}");
    expect(out).toContain("## Real {/* #real */}");
  });
});

describe("stripHeadingIdsAnywhere", () => {
  it("removes mid-line heading-id tokens that stripHeadingIds would miss", () => {
    const input = "## Foo {/* #wrong */} bar\n";
    expect(stripHeadingIds(input)).toBe(input);
    expect(stripHeadingIdsAnywhere(input)).toBe("## Foo bar\n");
  });
});

describe("stripHeadingIds", () => {
  it("removes HTML anchors, classic suffixes, and MDX comments", () => {
    const input = [
      '<a id="orphan"></a>',
      "# Welcome {#welcome}",
      "",
      '<a id="features"></a>',
      "## Features {/* #features */}",
      "",
      "```",
      "## Not a heading {#inside}",
      "```",
      "",
    ].join("\n");
    const out = stripHeadingIds(input);
    expect(out).toBe(
      ["# Welcome", "", "## Features", "", "```", "## Not a heading {#inside}", "```", ""].join(
        "\n"
      )
    );
  });
});
