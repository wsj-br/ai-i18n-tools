import { describe, expect, it } from "vitest";
import {
  docsPathToNextraRoute,
  normalizeNextraDocLinks,
  normalizeOneNextraLink,
  type NextraLinkNormalizeContext,
} from "../../src/processors/nextra-link-normalize.js";

function ctx(over: Partial<NextraLinkNormalizeContext> = {}): NextraLinkNormalizeContext {
  return {
    relPath: "content/en/guide/getting-started.mdx",
    docsRoot: "content/en",
    ...over,
  };
}

describe("docsPathToNextraRoute", () => {
  it("maps content-root paths to site routes", () => {
    expect(docsPathToNextraRoute("content/en", "content/en/guide/getting-started.mdx")).toBe(
      "/guide/getting-started"
    );
    expect(docsPathToNextraRoute("content/en", "guide/getting-started")).toBe(
      "/guide/getting-started"
    );
  });

  it("preserves trailing slash for section index directories", () => {
    expect(docsPathToNextraRoute("content/en", "guide/")).toBe("/guide/");
    expect(docsPathToNextraRoute("content/en", "guide/index.mdx")).toBe("/guide/");
  });
});

describe("normalizeOneNextraLink", () => {
  it("leaves external and site-root URLs unchanged", () => {
    expect(normalizeOneNextraLink("https://example.com/x", ctx())).toBe("https://example.com/x");
    expect(normalizeOneNextraLink("/guide/getting-started", ctx())).toBe("/guide/getting-started");
    expect(normalizeOneNextraLink("#section", ctx())).toBe("#section");
  });

  it("rewrites content-root paths to locale-neutral routes", () => {
    expect(normalizeOneNextraLink("content/en/guide/getting-started.mdx", ctx())).toBe(
      "/guide/getting-started"
    );
    expect(normalizeOneNextraLink("content/en/index.mdx", ctx())).toBe("/");
  });

  it("rewrites relative guide links to site routes", () => {
    expect(
      normalizeOneNextraLink(
        "./guide/getting-started.mdx",
        ctx({ relPath: "content/en/index.mdx" })
      )
    ).toBe("/guide/getting-started");
    expect(
      normalizeOneNextraLink(
        "./getting-started.mdx",
        ctx({ relPath: "content/en/guide/index.mdx" })
      )
    ).toBe("/guide/getting-started");
  });

  it("strips .mdx extension from absolute site paths", () => {
    expect(normalizeOneNextraLink("/guide/getting-started.mdx", ctx())).toBe(
      "/guide/getting-started"
    );
  });

  it("covers empty, protocol-relative, mailto, and sibling markdown links", () => {
    expect(normalizeOneNextraLink("   ", ctx())).toBe("");
    expect(normalizeOneNextraLink("mailto:docs@example.com", ctx())).toBe(
      "mailto:docs@example.com"
    );
    expect(normalizeOneNextraLink("//cdn.example.com/x", ctx())).toBe("//cdn.example.com/x");
    expect(normalizeOneNextraLink("content/pt/guide.mdx", ctx())).toBe("/content/pt/guide");
    expect(
      normalizeOneNextraLink("getting-started.mdx", ctx({ relPath: "content/en/guide/page.mdx" }))
    ).toBe("/guide/getting-started");
    expect(normalizeOneNextraLink("notes/extra.md", ctx({ relPath: "index.mdx" }))).toBe(
      "/notes/extra"
    );
    expect(
      normalizeOneNextraLink("../README.md", ctx({ relPath: "content/en/guide/page.mdx" }))
    ).toBe("/README");
    expect(docsPathToNextraRoute("content/en", "content/en")).toBe("/");
  });
});

describe("normalizeNextraDocLinks", () => {
  it("rewrites markdown link targets in body", () => {
    const body = "See [Getting started](content/en/guide/getting-started.mdx).";
    expect(normalizeNextraDocLinks(body, ctx())).toBe(
      "See [Getting started](/guide/getting-started)."
    );
  });
});
