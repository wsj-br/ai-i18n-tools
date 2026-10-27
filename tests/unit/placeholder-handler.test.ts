import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { PlaceholderHandler } from "../../src/processors/placeholder-handler.js";
import { protectDocAnchors, restoreDocAnchors } from "../../src/processors/anchor-placeholders.js";
import {
  collectPostRestorePlaceholderErrors,
  collectPreRestorePlaceholderErrors,
} from "../../src/processors/placeholder-integrity.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const vueBracesUrl = pathToFileURL(
  path.join(repoRoot, "scripts", "vue-braces-for-markdown.mjs")
).href;
const { escapeVueBracesInMarkdown } = await import(vueBracesUrl);

describe("PlaceholderHandler", () => {
  it("skips emphasis masking when emphasis is false", () => {
    const h = new PlaceholderHandler();
    const src = `**bold** and *italic*`;
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.emphasisProtected).toBe(false);
    expect(st.text).not.toContain("{{SE}}");
    expect(st.text).not.toContain("{{IT}}");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it("round-trips URL and admonition placeholders", () => {
    const h = new PlaceholderHandler();
    const src = `:::note\n<!-- toc -->\nSee [link](https://x.com) and <small id="x">**bold** + *italic* + ~~strike~~</small>\n:::`;
    const st = h.protectForTranslation(src);
    expect(st.text).toContain("{{HTM_");
    expect(st.text).toContain("{{URL_");
    expect(st.text).toContain("ADM_OPEN");
    expect(st.text).toContain("{{SE}}");
    expect(st.text).toContain("{{IT}}");
    expect(st.text).toContain("{{ST}}");
    const back = h.restoreAfterTranslation(st.text, st);
    expect(back).toContain("https://x.com");
    expect(back).toContain(":::note");
    expect(back).toContain("<!-- toc -->");
    expect(back).toContain('<small id="x">');
    expect(back).toContain("**");
    expect(back).toContain("bold");
    expect(back).toContain("*italic*");
    expect(back).toContain("~~strike~~");
  });

  it("protectUrls and restoreUrls round-trip", () => {
    const h = new PlaceholderHandler();
    const src = `See [x](https://a.com)`;
    const p = h.protectUrls(src);
    expect(p.urlMap.length).toBe(1);
    expect(h.restoreUrls(p.text, p.urlMap)).toContain("https://a.com");
  });

  it("protectAdmonitions and restoreAdmonitions round-trip", () => {
    const h = new PlaceholderHandler();
    const src = `:::tip\nHi\n:::`;
    const p = h.protectAdmonitions(src);
    expect(p.openMap.length).toBeGreaterThan(0);
    expect(h.restoreAdmonitions(p.text, p.openMap, p.endMap, p.titleCloseMap)).toContain(":::tip");
  });

  it("translates a bracketed admonition title end-to-end while protecting the syntax", () => {
    const h = new PlaceholderHandler();
    const src = ":::note[Your Title **with** `code`]\nBody text.\n:::";
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.openMap).toEqual([":::note["]);
    expect(st.titleCloseMap).toEqual(["]"]);
    expect(st.text).toContain("{{ADM_OPEN_0}}Your Title");
    expect(st.text).toContain("{{ADM_TCLOSE_0}}");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it("restores Docusaurus heading id after model hyphen drift", () => {
    const line = "### Step {#my-id}";
    const p = protectDocAnchors(line);
    expect(p.docusaurusHeadingIds).toEqual(["{#my-id}"]);
    const corrupted = p.protected.replace("HDG_0", "HDG-0");
    const out = restoreDocAnchors(corrupted, [], p.docusaurusHeadingIds);
    expect(out).toBe(line);
  });

  it("peels MDX heading-id comment `{/* #id */}` out of the prompt and pins it back", () => {
    const h = new PlaceholderHandler();
    const src = "### Hello World {/* #my-explicit-id */}";
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.mdxMap).toEqual([]);
    expect(st.headingIdSuffixes).toEqual(["{/* #my-explicit-id */}"]);
    expect(st.text).toBe("### Hello World");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it("pins a heading-id suffix to end of line after Hindi-style word reorder", () => {
    const h = new PlaceholderHandler();
    const src = "## HTTPS with a reverse proxy {/* #https-with-a-reverse-proxy */}";
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.text).toBe("## HTTPS with a reverse proxy");
    expect(st.headingIdSuffixes).toEqual(["{/* #https-with-a-reverse-proxy */}"]);
    expect(st.mdxMap).toEqual([]);
    const translated = "## रिवर्स प्रॉक्सी के साथ HTTPS";
    expect(h.restoreAfterTranslation(translated, st)).toBe(
      "## रिवर्स प्रॉक्सी के साथ HTTPS {/* #https-with-a-reverse-proxy */}"
    );
  });

  it("peels classic `{#id}` suffixes so they are not sent as `{{HDG_N}}`", () => {
    const h = new PlaceholderHandler();
    const src = "### Hello {#hello}";
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.docusaurusHeadingIds).toEqual([]);
    expect(st.headingIdSuffixes).toEqual(["{#hello}"]);
    expect(st.text).toBe("### Hello");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it("exposes only translatable text inside <Highlight> while protecting tags + brace expressions", () => {
    const h = new PlaceholderHandler();
    const src = `Use <Highlight color="#25c2a0">Docusaurus green</Highlight> for {frontMatter.title}.`;
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.mdxMap).toEqual([
      `<Highlight color="#25c2a0">`,
      "</Highlight>",
      "{frontMatter.title}",
    ]);
    expect(st.text).toBe("Use {{MDX_0}}Docusaurus green{{MDX_1}} for {{MDX_2}}.");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it.each([
    [
      "Docusaurus note",
      ":::note Save me\n\n```js [Do not translate]\nconst x = 1;\n:::\n```\n\n:::",
      "Save me",
    ],
    ["VitePress warning", "::: warning Save me\n\n~~~md\n:::\n~~~\n\n:::", "Save me"],
    ["Pandoc div", "::: {.note} Save me\n\n```js\n:::\n```\n:::", "Save me"],
    ["MyST caution", ":::{caution} Save me\n\n```js\nconst x = 1;\n```\n:::", "Save me"],
    [
      "MkDocs note",
      '!!! note "Save me"\n\n    ```js [Do not translate]\n    const x = 1;\n    ```\n',
      "Save me",
    ],
  ])("masks fences inside a %s without treating the sample as a closer", (_name, src, title) => {
    const h = new PlaceholderHandler();
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.text).toContain(title);
    expect(st.text).not.toContain("const x");
    expect(st.text).not.toContain("Do not translate");
    expect(st.codeFenceMap).toHaveLength(1);
    expect(st.codeFenceMap[0]).toContain(src.includes("~~~") ? "~~~" : "```");
    const code = st.text.indexOf("{{CDF_0}}");
    expect(code).toBeGreaterThanOrEqual(0);
    if (src.startsWith("!!!")) {
      expect(st.endMap).toEqual([]);
      expect(st.text.indexOf("{{ADM_OPEN_0}}")).toBeLessThan(code);
    } else {
      expect(st.endMap).toEqual([":::"]);
      expect(st.text.indexOf("{{ADM_OPEN_0}}")).toBeLessThan(code);
      expect(code).toBeLessThan(st.text.indexOf("{{ADM_END_0}}"));
    }
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it("masks a code fence inside a container before admonition markers", () => {
    const h = new PlaceholderHandler();
    const src =
      "::: tip Note\nRead this.\n\n```md\n## Not a heading {#id}\n:::\nnope\n```\n\n## Real {#real}\n:::";
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.codeFenceMap).toEqual(["```md\n## Not a heading {#id}\n:::\nnope\n```"]);
    expect(st.text).not.toContain("nope");
    expect(st.text).not.toContain("{#id}");
    expect(st.headingIdSuffixes).toEqual(["{#real}"]);
    expect(st.endMap).toEqual([":::"]);
    const open = st.text.indexOf("{{ADM_OPEN_0}}");
    const code = st.text.indexOf("{{CDF_0}}");
    const end = st.text.indexOf("{{ADM_END_0}}");
    expect(open).toBeGreaterThanOrEqual(0);
    expect(code).toBeGreaterThan(open);
    expect(end).toBeGreaterThan(code);
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it("restores when optional maps are omitted (legacy callers)", () => {
    const h = new PlaceholderHandler();
    expect(
      h.restoreAfterTranslation("Hello", {
        htmlTagMap: [],
        openMap: [],
        endMap: [],
        htmlAnchors: [],
        docusaurusHeadingIds: [],
        urlMap: [],
        boldCodeMap: [],
        ilcMap: [],
      })
    ).toBe("Hello");
  });

  it("keeps a documented {{SE}} token when emphasis masking is on", () => {
    const h = new PlaceholderHandler();
    const src = "Use **bold** and markers like <code v-pre>{{SE}}</code> here.";
    const st = h.protectForTranslation(src, { emphasis: true });
    expect(st.emphasisProtected).toBe(true);
    expect(st.text).toContain("{{LIT_SE}}");
    expect(st.text).toContain("{{SE}}bold{{SE}}");
    expect(st.text).not.toContain(">{{SE}}<");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);

    const literal = st.text.match(/\{\{HTM_\d+\}\}\{\{LIT_SE\}\}\{\{HTM_\d+\}\}/)?.[0];
    expect(literal).toBeDefined();
    const swapped = `Markers ${literal} and use {{SE}}bold{{SE}}.`;
    expect(collectPreRestorePlaceholderErrors(st, swapped)).toEqual([]);

    const restored = h.restoreAfterTranslation(swapped, st);
    expect(restored).toBe("Markers <code v-pre>{{SE}}</code> and use **bold**.");
    expect(restored).not.toContain("{{LIT_SE}}");
    expect(collectPostRestorePlaceholderErrors(src, restored)).toEqual([]);

    const once = escapeVueBracesInMarkdown(restored);
    expect(once).toContain("<code v-pre>{{SE}}</code>");
    expect(once).not.toContain("<code v-pre>**</code>");
    expect(escapeVueBracesInMarkdown(once)).toBe(once);
  });

  it("does not quarantine a documented {{SE}} when emphasis masking is off", () => {
    const h = new PlaceholderHandler();
    const src = "Markers like <code v-pre>{{SE}}</code> stay literal.";
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.text).toContain("{{SE}}");
    expect(st.text).not.toContain("{{LIT_SE}}");
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });

  it("keeps legacy `{#id}` heading id as `{{HDG_N}}` even when MDX brace protection runs after it", () => {
    const h = new PlaceholderHandler();
    const src = "### Step {#my-id} and {value}";
    const st = h.protectForTranslation(src, { emphasis: false });
    expect(st.docusaurusHeadingIds).toEqual(["{#my-id}"]);
    expect(st.mdxMap).toEqual(["{value}"]);
    expect(h.restoreAfterTranslation(st.text, st)).toBe(src);
  });
});
