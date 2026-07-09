import { describe, expect, it } from "vitest";
import {
  docsPathToFumadocsRoute,
  normalizeFumadocsDocLinks,
  normalizeOneFumadocsLink,
  type FumadocsLinkNormalizeContext,
} from "../../src/processors/fumadocs-link-normalize.js";

function ctx(over: Partial<FumadocsLinkNormalizeContext> = {}): FumadocsLinkNormalizeContext {
  return {
    relPath: "content/docs/guide/getting-started.mdx",
    docsRoot: "content/docs",
    ...over,
  };
}

describe("docsPathToFumadocsRoute", () => {
  it("maps content-root paths to /docs routes", () => {
    expect(
      docsPathToFumadocsRoute("content/docs", "content/docs/guide/getting-started.mdx")
    ).toBe("/docs/guide/getting-started");
    expect(docsPathToFumadocsRoute("content/docs/en", "content/docs/en/guide/foo.mdx")).toBe(
      "/docs/guide/foo"
    );
  });

  it("preserves trailing slash for section index directories", () => {
    expect(docsPathToFumadocsRoute("content/docs", "guide/")).toBe("/docs/guide/");
    expect(docsPathToFumadocsRoute("content/docs", "guide/index.mdx")).toBe("/docs/guide/");
  });
});

describe("normalizeOneFumadocsLink", () => {
  it("leaves external and anchor URLs unchanged", () => {
    expect(normalizeOneFumadocsLink("https://example.com/x", ctx())).toBe("https://example.com/x");
    expect(normalizeOneFumadocsLink("#section", ctx())).toBe("#section");
  });

  it("rewrites content-root paths to /docs routes", () => {
    expect(normalizeOneFumadocsLink("content/docs/guide/getting-started.mdx", ctx())).toBe(
      "/docs/guide/getting-started"
    );
    expect(normalizeOneFumadocsLink("content/docs/index.mdx", ctx())).toBe("/docs");
  });
});

describe("normalizeFumadocsDocLinks", () => {
  it("rewrites markdown link targets in body", () => {
    const body = "See [Guide](content/docs/guide/getting-started.mdx).";
    expect(normalizeFumadocsDocLinks(body, ctx())).toBe(
      "See [Guide](/docs/guide/getting-started)."
    );
  });
});
