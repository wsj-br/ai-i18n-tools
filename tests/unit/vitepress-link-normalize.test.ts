import { describe, expect, it } from "vitest";
import {
  docsPathToVitepressRoute,
  normalizeOneVitepressLink,
  normalizeVitepressDocLinks,
  type VitepressLinkNormalizeContext,
} from "../../src/processors/vitepress-link-normalize.js";

function ctx(over: Partial<VitepressLinkNormalizeContext> = {}): VitepressLinkNormalizeContext {
  return {
    relPath: "docs/guide/quick-start.md",
    docsRoot: "docs",
    ...over,
  };
}

describe("docsPathToVitepressRoute", () => {
  it("maps docs-root paths to site routes", () => {
    expect(docsPathToVitepressRoute("docs", "docs/guide/quick-start.md")).toBe("/guide/quick-start");
    expect(docsPathToVitepressRoute("docs", "guide/json")).toBe("/guide/json");
  });

  it("preserves trailing slash for section index directories", () => {
    expect(docsPathToVitepressRoute("docs", "guide/images-and-screenshots/")).toBe(
      "/guide/images-and-screenshots/"
    );
    expect(docsPathToVitepressRoute("docs", "guide/images-and-screenshots/index.md")).toBe(
      "/guide/images-and-screenshots/"
    );
    expect(docsPathToVitepressRoute("docs", "examples/")).toBe("/examples/");
  });
});

describe("normalizeOneVitepressLink", () => {
  it("leaves external and site-root URLs unchanged", () => {
    expect(normalizeOneVitepressLink("https://example.com/x", ctx())).toBe("https://example.com/x");
    expect(normalizeOneVitepressLink("/guide/json", ctx())).toBe("/guide/json");
    expect(normalizeOneVitepressLink("#section", ctx())).toBe("#section");
  });

  it("rewrites README-style docs paths to VitePress routes", () => {
    expect(normalizeOneVitepressLink("docs/guide/json.md", ctx())).toBe("/guide/json");
    expect(normalizeOneVitepressLink("docs/reference/cli-commands.md", ctx())).toBe(
      "/reference/cli-commands"
    );
    expect(normalizeOneVitepressLink("docs/guide/images-and-screenshots/", ctx())).toBe(
      "/guide/images-and-screenshots/"
    );
    expect(normalizeOneVitepressLink("docs/examples.md", ctx())).toBe("/examples");
    expect(normalizeOneVitepressLink("docs/examples/console-app.md", ctx())).toBe(
      "/examples#console-app"
    );
  });

  it("rewrites legacy example sub-routes to anchors on the examples page", () => {
    expect(normalizeOneVitepressLink("/examples/console-app", ctx())).toBe(
      "/examples#console-app"
    );
    expect(normalizeOneVitepressLink("/examples/", ctx())).toBe("/examples");
  });

  it("leaves repo-outside paths unchanged", () => {
    expect(normalizeOneVitepressLink("examples/console-app/", ctx())).toBe("examples/console-app/");
    expect(
      normalizeOneVitepressLink(
        "https://github.com/org/repo/tree/main/examples/console-app/",
        ctx()
      )
    ).toBe("https://github.com/org/repo/tree/main/examples/console-app/");
  });

  it("rewrites locale-relative guide links to site routes", () => {
    expect(
      normalizeOneVitepressLink(
        "../guide/ui-strings/plain-html.md#marking-html-for-translation",
        ctx({ relPath: "docs/de/reference/architecture.md" })
      )
    ).toBe("/guide/ui-strings/plain-html#marking-html-for-translation");
  });

  it("rewrites homepage README links", () => {
    expect(
      normalizeOneVitepressLink("./README.md", ctx({ relPath: "docs/de/index.md" }))
    ).toBe("/");
  });
});

describe("normalizeVitepressDocLinks", () => {
  it("rewrites markdown link targets in body text", () => {
    const body = "See [JSON](docs/guide/json.md) and [demo](examples/console-app/).";
    expect(normalizeVitepressDocLinks(body, ctx())).toBe(
      "See [JSON](/guide/json) and [demo](examples/console-app/)."
    );
  });
});
