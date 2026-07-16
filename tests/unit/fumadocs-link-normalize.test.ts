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
    expect(docsPathToFumadocsRoute("content/docs", "content/docs/guide/getting-started.mdx")).toBe(
      "/docs/guide/getting-started"
    );
    expect(docsPathToFumadocsRoute("content/docs/en", "content/docs/en/guide/foo.mdx")).toBe(
      "/docs/guide/foo"
    );
  });

  it("maps the docs root itself to /docs", () => {
    expect(docsPathToFumadocsRoute("content/docs", "content/docs")).toBe("/docs");
    expect(docsPathToFumadocsRoute("content/docs", "content/docs/index.mdx")).toBe("/docs");
    expect(docsPathToFumadocsRoute("content/docs", "content/docs/")).toBe("/docs");
  });

  it("treats paths already relative to the docs root as route segments", () => {
    expect(docsPathToFumadocsRoute("content/docs", "guide/getting-started.mdx")).toBe(
      "/docs/guide/getting-started"
    );
    expect(docsPathToFumadocsRoute("content/docs", "guide/foo")).toBe("/docs/guide/foo");
  });

  it("preserves trailing slash for section index directories", () => {
    expect(docsPathToFumadocsRoute("content/docs", "guide/")).toBe("/docs/guide/");
    expect(docsPathToFumadocsRoute("content/docs", "guide/index.mdx")).toBe("/docs/guide/");
    expect(docsPathToFumadocsRoute("content/docs", "guide/index.md")).toBe("/docs/guide/");
  });

  it("does not add a trailing slash to the /docs root route", () => {
    expect(docsPathToFumadocsRoute("content/docs", "content/docs/")).toBe("/docs");
    expect(docsPathToFumadocsRoute("content/docs", "content/docs/index/")).toBe("/docs");
  });
});

describe("normalizeOneFumadocsLink", () => {
  it("leaves empty, external, mailto, protocol-relative, and anchor URLs unchanged", () => {
    expect(normalizeOneFumadocsLink("", ctx())).toBe("");
    expect(normalizeOneFumadocsLink("   ", ctx())).toBe("");
    expect(normalizeOneFumadocsLink("https://example.com/x", ctx())).toBe("https://example.com/x");
    expect(normalizeOneFumadocsLink("HTTP://example.com/x", ctx())).toBe("HTTP://example.com/x");
    expect(normalizeOneFumadocsLink("mailto:docs@example.com", ctx())).toBe(
      "mailto:docs@example.com"
    );
    expect(normalizeOneFumadocsLink("//cdn.example.com/a.png", ctx())).toBe(
      "//cdn.example.com/a.png"
    );
    expect(normalizeOneFumadocsLink("#section", ctx())).toBe("#section");
  });

  it("strips markdown extensions from absolute site paths", () => {
    expect(normalizeOneFumadocsLink("/docs/guide/getting-started.mdx", ctx())).toBe(
      "/docs/guide/getting-started"
    );
    expect(normalizeOneFumadocsLink("/docs/guide/getting-started.md", ctx())).toBe(
      "/docs/guide/getting-started"
    );
    expect(normalizeOneFumadocsLink("/docs/guide/getting-started.mdx#intro", ctx())).toBe(
      "/docs/guide/getting-started#intro"
    );
  });

  it("leaves absolute site paths without markdown extensions unchanged", () => {
    expect(normalizeOneFumadocsLink("/docs/guide/getting-started", ctx())).toBe(
      "/docs/guide/getting-started"
    );
    expect(normalizeOneFumadocsLink("/logo.svg", ctx())).toBe("/logo.svg");
    expect(normalizeOneFumadocsLink("/docs/guide/#section", ctx())).toBe("/docs/guide/#section");
  });

  it("rewrites content-root paths to /docs routes", () => {
    expect(normalizeOneFumadocsLink("content/docs/guide/getting-started.mdx", ctx())).toBe(
      "/docs/guide/getting-started"
    );
    expect(normalizeOneFumadocsLink("content/docs/index.mdx", ctx())).toBe("/docs");
    expect(normalizeOneFumadocsLink("content/docs", ctx())).toBe("/docs");
    expect(normalizeOneFumadocsLink("content/docs/guide/foo.mdx#bar", ctx())).toBe(
      "/docs/guide/foo#bar"
    );
  });

  it("rewrites other content/ paths through the docs route mapper", () => {
    expect(normalizeOneFumadocsLink("content/blog/post.mdx", ctx())).toBe(
      "/docs/content/blog/post"
    );
  });

  it("rewrites relative links that resolve under the docs root", () => {
    expect(normalizeOneFumadocsLink("./installation.mdx", ctx())).toBe("/docs/guide/installation");
    expect(
      normalizeOneFumadocsLink(
        "../reference/cli.mdx",
        ctx({ relPath: "content/docs/guide/getting-started.mdx" })
      )
    ).toBe("/docs/reference/cli");
    expect(
      normalizeOneFumadocsLink(
        "../../guide/foo.mdx",
        ctx({ relPath: "content/docs/guide/nested/page.mdx" })
      )
    ).toBe("/docs/guide/foo");
    expect(
      normalizeOneFumadocsLink(
        "./guide/getting-started.mdx#mark",
        ctx({ relPath: "content/docs/index.mdx" })
      )
    ).toBe("/docs/guide/getting-started#mark");
  });

  it("leaves non-markdown relative links outside the docs root unchanged", () => {
    expect(
      normalizeOneFumadocsLink(
        "../../other/logo.png",
        ctx({ relPath: "content/docs/guide/getting-started.mdx" })
      )
    ).toBe("../../other/logo.png");
  });

  it("still strips .md from relative links that resolve outside the docs root", () => {
    expect(
      normalizeOneFumadocsLink(
        "../../../README.md",
        ctx({ relPath: "content/docs/guide/getting-started.mdx" })
      )
    ).toBe("/docs/../../../README");
  });

  it("rewrites same-directory markdown filenames via the source directory", () => {
    expect(normalizeOneFumadocsLink("installation.mdx", ctx())).toBe("/docs/guide/installation");
    expect(normalizeOneFumadocsLink("installation.md#setup", ctx())).toBe(
      "/docs/guide/installation#setup"
    );
  });

  it("rewrites nested markdown paths by stripping the extension", () => {
    expect(normalizeOneFumadocsLink("guide/installation.mdx", ctx())).toBe(
      "/docs/guide/installation"
    );
  });

  it("passes through plain relative paths without a markdown extension", () => {
    expect(normalizeOneFumadocsLink("images/logo.png", ctx())).toBe("images/logo.png");
    expect(normalizeOneFumadocsLink("images/logo.png#fragment", ctx())).toBe(
      "images/logo.png#fragment"
    );
  });

  it("handles a relPath with no directory segment", () => {
    expect(
      normalizeOneFumadocsLink(
        "readme.mdx",
        ctx({ relPath: "readme.mdx", docsRoot: "content/docs" })
      )
    ).toBe("/docs//readme");
  });
});

describe("normalizeFumadocsDocLinks", () => {
  it("rewrites markdown link targets in body", () => {
    const body = "See [Guide](content/docs/guide/getting-started.mdx).";
    expect(normalizeFumadocsDocLinks(body, ctx())).toBe(
      "See [Guide](/docs/guide/getting-started)."
    );
  });

  it("rewrites multiple links and preserves link text", () => {
    const body =
      "See [A](content/docs/guide/a.mdx) and [B](./b.mdx#section) plus [ext](https://example.com).";
    expect(normalizeFumadocsDocLinks(body, ctx())).toBe(
      "See [A](/docs/guide/a) and [B](/docs/guide/b#section) plus [ext](https://example.com)."
    );
  });

  it("rewrites src attribute URLs", () => {
    const body = `![Shot](content/docs/assets/shot.png)\n<img src="content/docs/assets/shot.png" />`;
    expect(normalizeFumadocsDocLinks(body, ctx())).toBe(
      `![Shot](/docs/assets/shot.png)\n<img src="/docs/assets/shot.png" />`
    );
  });

  it("trims whitespace inside src attributes before rewriting", () => {
    const body = `<img src="  content/docs/assets/shot.png  " />`;
    expect(normalizeFumadocsDocLinks(body, ctx())).toBe(`<img src="/docs/assets/shot.png" />`);
  });
});
