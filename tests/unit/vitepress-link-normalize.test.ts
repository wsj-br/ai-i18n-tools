import { describe, expect, it } from "vitest";
import {
  applyVitepressLocaleRoutePrefix,
  docsPathToVitepressRoute,
  normalizeOneVitepressLink,
  normalizeVitepressDocLinks,
  normalizeVitepressFrontmatterLinks,
  prefixVitepressThemeConfigLinks,
  prefixVitepressThemeNavLinks,
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
    expect(docsPathToVitepressRoute("docs", "docs/guide/quick-start.md")).toBe(
      "/guide/quick-start"
    );
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

describe("applyVitepressLocaleRoutePrefix", () => {
  it("prefixes internal content routes", () => {
    expect(applyVitepressLocaleRoutePrefix("/guide/quick-start", "/pt-BR")).toBe(
      "/pt-BR/guide/quick-start"
    );
    expect(applyVitepressLocaleRoutePrefix("/reference/configuration", "/de")).toBe(
      "/de/reference/configuration"
    );
    expect(applyVitepressLocaleRoutePrefix("/examples", "/pt-BR")).toBe("/pt-BR/examples");
    expect(applyVitepressLocaleRoutePrefix("/", "/pt-BR")).toBe("/pt-BR/");
  });

  it("leaves public assets and external URLs unchanged", () => {
    expect(applyVitepressLocaleRoutePrefix("/logo.svg", "/pt-BR")).toBe("/logo.svg");
    expect(applyVitepressLocaleRoutePrefix("/translation-dashboard.png", "/pt-BR")).toBe(
      "/translation-dashboard.png"
    );
    expect(applyVitepressLocaleRoutePrefix("https://github.com/org/repo", "/pt-BR")).toBe(
      "https://github.com/org/repo"
    );
  });

  it("is idempotent for already-prefixed routes", () => {
    expect(applyVitepressLocaleRoutePrefix("/pt-BR/guide/quick-start", "/pt-BR")).toBe(
      "/pt-BR/guide/quick-start"
    );
  });
});

describe("normalizeOneVitepressLink", () => {
  it("leaves external and site-root URLs unchanged", () => {
    expect(normalizeOneVitepressLink("https://example.com/x", ctx())).toBe("https://example.com/x");
    expect(normalizeOneVitepressLink("/guide/json", ctx())).toBe("/guide/json");
    expect(normalizeOneVitepressLink("#section", ctx())).toBe("#section");
  });

  it("prefixes content routes for locale output", () => {
    expect(normalizeOneVitepressLink("/guide/quick-start", ctx({ localeRoutePrefix: "/pt-BR" }))).toBe(
      "/pt-BR/guide/quick-start"
    );
    expect(normalizeOneVitepressLink("/logo.svg", ctx({ localeRoutePrefix: "/pt-BR" }))).toBe(
      "/logo.svg"
    );
    expect(
      normalizeOneVitepressLink("https://github.com/wsj-br/ai-i18n-tools", ctx({ localeRoutePrefix: "/pt-BR" }))
    ).toBe("https://github.com/wsj-br/ai-i18n-tools");
  });

  it("rewrites README-style docs paths to VitePress routes", () => {
    expect(normalizeOneVitepressLink("docs/guide/json.md", ctx())).toBe("/guide/json");
    expect(normalizeOneVitepressLink("docs/reference/cli-commands.md", ctx())).toBe(
      "/reference/cli-commands/"
    );
    expect(normalizeOneVitepressLink("docs/reference/cli-commands/", ctx())).toBe(
      "/reference/cli-commands/"
    );
    expect(normalizeOneVitepressLink("docs/reference/cli-commands/documents.md", ctx())).toBe(
      "/reference/cli-commands/documents"
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
    expect(normalizeOneVitepressLink("/examples/console-app", ctx())).toBe("/examples#console-app");
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
    expect(normalizeOneVitepressLink("./README.md", ctx({ relPath: "docs/de/index.md" }))).toBe(
      "/"
    );
  });
});

describe("normalizeVitepressDocLinks", () => {
  it("rewrites markdown link targets in body text", () => {
    const body = "See [JSON](docs/guide/json.md) and [demo](examples/console-app/).";
    expect(normalizeVitepressDocLinks(body, ctx())).toBe(
      "See [JSON](/guide/json) and [demo](examples/console-app/)."
    );
  });

  it("prefixes absolute content routes in body for locale output", () => {
    const body = "See [Quick start](/guide/quick-start) and [logo](/logo.svg).";
    expect(normalizeVitepressDocLinks(body, ctx({ localeRoutePrefix: "/pt-BR" }))).toBe(
      "See [Quick start](/pt-BR/guide/quick-start) and [logo](/logo.svg)."
    );
  });
});

describe("normalizeVitepressFrontmatterLinks", () => {
  it("rewrites hero action links and preserves public asset src", () => {
    const data = {
      hero: {
        image: { src: "/logo.svg", alt: "Logo" },
        actions: [
          { theme: "brand", text: "Get started", link: "/guide/quick-start" },
          { theme: "alt", text: "GitHub", link: "https://github.com/wsj-br/ai-i18n-tools" },
        ],
      },
      features: [{ title: "Docs", details: "Translate docs.", link: "/guide/documents/" }],
      prev: { label: "Previous", link: "/guide/installation" },
      next: "/guide/providers-and-models",
    };

    normalizeVitepressFrontmatterLinks(data, ctx({ localeRoutePrefix: "/pt-BR" }));

    expect(data.hero.actions[0].link).toBe("/pt-BR/guide/quick-start");
    expect(data.hero.actions[1].link).toBe("https://github.com/wsj-br/ai-i18n-tools");
    expect(data.hero.image.src).toBe("/logo.svg");
    expect(data.features[0].link).toBe("/pt-BR/guide/documents/");
    expect(data.prev.link).toBe("/pt-BR/guide/installation");
    expect(data.next).toBe("/pt-BR/guide/providers-and-models");
  });
});

describe("prefixVitepressThemeNavLinks", () => {
  it("prefixes nav and nested sidebar links with activeMatch", () => {
    const items = [
      {
        text: "Guide",
        link: "/guide/foo",
        activeMatch: "/guide/",
        items: [{ text: "Start", link: "/guide/getting-started" }],
      },
      { text: "GitHub", link: "https://github.com/org/repo" },
    ];
    const out = prefixVitepressThemeNavLinks(items, "/pt-BR");
    expect(out[0]?.link).toBe("/pt-BR/guide/foo");
    expect(out[0]?.activeMatch).toBe("/pt-BR/guide/");
    expect(out[0]?.items?.[0]?.link).toBe("/pt-BR/guide/getting-started");
    expect(out[1]?.link).toBe("https://github.com/org/repo");
  });

  it("is idempotent when links are already prefixed", () => {
    const items = [{ text: "Guide", link: "/pt-BR/guide/foo" }];
    expect(prefixVitepressThemeNavLinks(items, "/pt-BR")).toEqual(items);
  });

  it("returns a shallow copy when no locale prefix is set", () => {
    const items = [{ text: "Guide", link: "/guide/foo" }];
    expect(prefixVitepressThemeNavLinks(items, null)).toEqual(items);
  });
});

describe("prefixVitepressThemeConfigLinks", () => {
  it("prefixes nav and sidebar arrays on theme config", () => {
    const themeConfig = {
      nav: [{ text: "Guide", link: "/guide/foo" }],
      sidebar: [{ text: "Section", items: [{ text: "Page", link: "/reference/configuration" }] }],
      footer: { message: "MIT" },
    };
    const out = prefixVitepressThemeConfigLinks(themeConfig, "/de");
    expect(out.nav[0]?.link).toBe("/de/guide/foo");
    expect(out.sidebar[0]?.items?.[0]?.link).toBe("/de/reference/configuration");
    expect(out.footer).toEqual({ message: "MIT" });
  });
});
