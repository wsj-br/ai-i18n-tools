import { describe, expect, it } from "vitest";
import {
  applyFrontmatterFieldTranslations,
  collectTranslatableFrontmatterFields,
  decodeFrontmatterShell,
  encodeFrontmatterShell,
  resolveFrontmatterFieldAllowList,
} from "../../src/extractors/frontmatter-fields.js";

describe("frontmatter-fields", () => {
  it("collects Starlight and Docusaurus prose fields", () => {
    const data = {
      title: "Quick Start",
      description: "Get started fast.",
      sidebar: { order: 1, label: "Start here" },
      sidebar_label: "Legacy label",
      pagination_label: "Prev page",
      keywords: ["i18n", "docs"],
      hero: {
        title: "Hero title",
        tagline: "Hero tagline",
        image: { alt: "Screenshot", file: "./x.png" },
        actions: [{ text: "Read docs", link: "/docs" }],
      },
      prev: "Previous",
      next: { label: "Next page", link: "/next" },
      slug: "quick-start",
    };
    const fields = collectTranslatableFrontmatterFields(data);
    expect(fields.map((f) => f.path)).toEqual([
      "title",
      "description",
      "sidebar_label",
      "pagination_label",
      "sidebar.label",
      "keywords.0",
      "keywords.1",
      "hero.title",
      "hero.tagline",
      "hero.image.alt",
      "hero.actions.0.text",
      "prev",
      "next.label",
    ]);
  });

  it("respects custom allow-list paths", () => {
    const data = { title: "T", description: "D", sidebar: { order: 2 } };
    const fields = collectTranslatableFrontmatterFields(data, ["title"]);
    expect(fields).toEqual([{ path: "title", value: "T" }]);
  });

  it("encodes shell and applies field translations", () => {
    const data = {
      title: "Hello",
      sidebar: { order: 1 },
    };
    const shell = decodeFrontmatterShell(encodeFrontmatterShell(data));
    applyFrontmatterFieldTranslations(shell, [{ path: "title", value: "Bonjour" }]);
    expect(shell.title).toBe("Bonjour");
    expect((shell.sidebar as { order: number }).order).toBe(1);
  });

  it("resolveFrontmatterFieldAllowList maps config shapes", () => {
    expect(resolveFrontmatterFieldAllowList(undefined)).toBeNull();
    expect(resolveFrontmatterFieldAllowList(true)).toBeNull();
    expect(resolveFrontmatterFieldAllowList(false)).toEqual([]);
    expect(resolveFrontmatterFieldAllowList(["title"])).toEqual(["title"]);
  });
});
