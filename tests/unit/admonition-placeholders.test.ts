import { describe, expect, it } from "vitest";
import {
  protectAdmonitionSyntax,
  restoreAdmonitionSyntax,
} from "../../src/processors/admonition-placeholders.js";

describe("admonition-placeholders", () => {
  it("protects Docusaurus-style directives and restores", () => {
    const src = `:::note Title\nBody\n:::`;
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap.length).toBeGreaterThan(0);
    expect(p.endMap.length).toBeGreaterThan(0);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap)).toBe(src);
  });

  it("keeps :::important intact instead of matching the info prefix", () => {
    const src = ":::important Keep this keyword\nBody\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap[0]).toBe(":::important ");
    expect(p.protected).toBe("{{ADM_OPEN_0}}Keep this keyword\nBody\n{{ADM_END_0}}");
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("protects a VitePress details container and leaves the summary translatable", () => {
    const src = "::: details Click to expand\nHidden\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual(["::: details "]);
    expect(p.protected).toBe("{{ADM_OPEN_0}}Click to expand\nHidden\n{{ADM_END_0}}");
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("protects an attached remark attribute block on the directive", () => {
    const src = ":::note{.large}\nBody\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::note{.large}"]);
    expect(p.protected).toBe("{{ADM_OPEN_0}}\nBody\n{{ADM_END_0}}");
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("protects a Pandoc fenced div and a MyST title", () => {
    const pandoc = "::: {.note}\nBody\n:::";
    const pandocProtected = protectAdmonitionSyntax(pandoc);
    expect(pandocProtected.openMap).toEqual(["::: {.note}"]);
    expect(pandocProtected.protected).toBe("{{ADM_OPEN_0}}\nBody\n{{ADM_END_0}}");
    expect(
      restoreAdmonitionSyntax(
        pandocProtected.protected,
        pandocProtected.openMap,
        pandocProtected.endMap,
        pandocProtected.titleCloseMap
      )
    ).toBe(pandoc);

    const myst = ":::{note} Title\nBody\n:::";
    const mystProtected = protectAdmonitionSyntax(myst);
    expect(mystProtected.openMap).toEqual([":::{note} "]);
    expect(mystProtected.protected).toBe("{{ADM_OPEN_0}}Title\nBody\n{{ADM_END_0}}");
    expect(
      restoreAdmonitionSyntax(
        mystProtected.protected,
        mystProtected.openMap,
        mystProtected.endMap,
        mystProtected.titleCloseMap
      )
    ).toBe(myst);
  });

  it("protects a GitHub alert custom title and an Obsidian fold marker", () => {
    const titled = "> [!WARNING] Custom title\n> Body stays";
    const titledProtected = protectAdmonitionSyntax(titled);
    expect(titledProtected.openMap).toEqual(["> [!WARNING] "]);
    expect(titledProtected.protected).toBe("{{ADM_OPEN_0}}Custom title\n> Body stays");
    expect(
      restoreAdmonitionSyntax(
        titledProtected.protected,
        titledProtected.openMap,
        titledProtected.endMap,
        titledProtected.titleCloseMap
      )
    ).toBe(titled);

    const folded = "> [!info]- Folded\n> Hidden";
    const foldedProtected = protectAdmonitionSyntax(folded);
    expect(foldedProtected.openMap).toEqual(["> [!info]- "]);
    expect(foldedProtected.protected).toBe("{{ADM_OPEN_0}}Folded\n> Hidden");
    expect(
      restoreAdmonitionSyntax(
        foldedProtected.protected,
        foldedProtected.openMap,
        foldedProtected.endMap,
        foldedProtected.titleCloseMap
      )
    ).toBe(folded);
  });

  it("protects MkDocs markers and leaves the quoted title translatable", () => {
    const note = '!!! note "Optional title"\n    Body stays indented.\n';
    const noteProtected = protectAdmonitionSyntax(note);
    expect(noteProtected.openMap).toEqual(['!!! note "']);
    expect(noteProtected.titleCloseMap).toEqual(['"']);
    expect(noteProtected.protected).toBe(
      "{{ADM_OPEN_0}}Optional title{{ADM_TCLOSE_0}}\n    Body stays indented.\n"
    );
    expect(
      restoreAdmonitionSyntax(
        noteProtected.protected,
        noteProtected.openMap,
        noteProtected.endMap,
        noteProtected.titleCloseMap
      )
    ).toBe(note);

    const collapsed = "???+ tip inline end\n    Expanded body.\n";
    const collapsedProtected = protectAdmonitionSyntax(collapsed);
    expect(collapsedProtected.openMap).toEqual(["???+ tip inline end"]);
    expect(collapsedProtected.protected).toBe("{{ADM_OPEN_0}}\n    Expanded body.\n");
    expect(
      restoreAdmonitionSyntax(
        collapsedProtected.protected,
        collapsedProtected.openMap,
        collapsedProtected.endMap,
        collapsedProtected.titleCloseMap
      )
    ).toBe(collapsed);

    const collapsible = '??? warning "Careful"\n    Hidden.\n';
    const collapsibleProtected = protectAdmonitionSyntax(collapsible);
    expect(collapsibleProtected.openMap).toEqual(['??? warning "']);
    expect(collapsibleProtected.protected).toBe(
      "{{ADM_OPEN_0}}Careful{{ADM_TCLOSE_0}}\n    Hidden.\n"
    );
    expect(
      restoreAdmonitionSyntax(
        collapsibleProtected.protected,
        collapsibleProtected.openMap,
        collapsibleProtected.endMap,
        collapsibleProtected.titleCloseMap
      )
    ).toBe(collapsible);
  });

  it("protects a VitePress container and leaves the custom title translatable", () => {
    const src = "::: tip Disclaimer\nBody\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual(["::: tip "]);
    expect(p.protected).toBe("{{ADM_OPEN_0}}Disclaimer\nBody\n{{ADM_END_0}}");
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("masks only the directive prefix on the opener line so title text remains on that line", () => {
    const src = `:::note Title text\nBody\n:::`;
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::note "]);
    expect(p.protected).toBe(`{{ADM_OPEN_0}}Title text\nBody\n{{ADM_END_0}}`);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("exposes bracketed-title text for translation while protecting the brackets", () => {
    const src = ":::note[Your Title **with** _md_ `code`]\nBody\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::note["]);
    expect(p.titleCloseMap).toEqual(["]"]);
    expect(p.protected).toBe(
      "{{ADM_OPEN_0}}Your Title **with** _md_ `code`{{ADM_TCLOSE_0}}\nBody\n{{ADM_END_0}}"
    );
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("protects trailing attributes after a bracketed title", () => {
    const src = ":::tip[Pro tip]{.text--italic #my-tip}\nBody\n:::";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::tip["]);
    expect(p.titleCloseMap).toEqual(["]{.text--italic #my-tip}"]);
    expect(p.protected).toBe("{{ADM_OPEN_0}}Pro tip{{ADM_TCLOSE_0}}\nBody\n{{ADM_END_0}}");
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("round-trips nested admonitions with preserved colon counts and titles", () => {
    const src = [
      ":::::info[Parent]",
      "Parent body",
      "::::danger[Child]",
      "Child body",
      ":::tip[Deep Child]",
      "Deep body",
      ":::",
      "::::",
      ":::::",
    ].join("\n");
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap).toEqual([":::::info[", "::::danger[", ":::tip["]);
    expect(p.endMap).toEqual([":::", "::::", ":::::"]);
    expect(p.titleCloseMap).toEqual(["]", "]", "]"]);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap, p.titleCloseMap)).toBe(src);
  });

  it("protects GitHub alert syntax line", () => {
    const src = "> [!NOTE]\n> body";
    const p = protectAdmonitionSyntax(src);
    expect(p.openMap.some((l) => l.includes("[!NOTE]"))).toBe(true);
    const back = restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap);
    expect(back).toContain("[!NOTE]");
  });

  it("handles multiple closing colons variants", () => {
    const src = ":::tip\nx\n::::";
    const p = protectAdmonitionSyntax(src);
    expect(p.endMap.length).toBeGreaterThan(0);
    expect(restoreAdmonitionSyntax(p.protected, p.openMap, p.endMap)).toBe(src);
  });
});
