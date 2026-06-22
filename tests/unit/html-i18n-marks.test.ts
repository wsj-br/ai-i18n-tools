import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  collectHtmlI18nLocations,
  collectHtmlI18nStrings,
  markHtmlContent,
  normalizeI18nText,
} from "../../src/extractors/html-i18n-marks.js";
import { uiStringHash } from "../../src/extractors/ui-string-locations.js";

const FIXTURE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "dashboard-index-unmarked.html"
);

function values(html: string): string[] {
  return collectHtmlI18nStrings(html).map((s) => s.value);
}

describe("normalizeI18nText", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeI18nText("  Page   size:\n   ")).toBe("Page size:");
    expect(normalizeI18nText("a\n\t b")).toBe("a b");
  });
});

describe("collectHtmlI18nStrings", () => {
  it("reads textContent for bare data-i18n", () => {
    expect(values(`<button data-i18n>Next</button>`)).toEqual(["Next"]);
  });

  it("uses the valued marker as the explicit key (overrides content)", () => {
    expect(values(`<button data-i18n="Save">Different</button>`)).toEqual(["Save"]);
  });

  it("reads title and placeholder from bare attribute markers", () => {
    expect(values(`<input data-i18n-placeholder placeholder="Filename (partial)" />`)).toEqual([
      "Filename (partial)",
    ]);
    expect(values(`<button data-i18n-title title="Close the window">x</button>`)).toEqual([
      "Close the window",
    ]);
  });

  it("normalizes multi-line / indented text content", () => {
    const html = `<p data-i18n>\n   Hello\n   world\n</p>`;
    expect(values(html)).toEqual(["Hello world"]);
  });

  it("decodes basic HTML entities", () => {
    expect(values(`<span data-i18n>Tom &amp; Jerry &lt;3</span>`)).toEqual(["Tom & Jerry <3"]);
  });

  it("does not confuse data-i18n with the data-i18n-title prefix", () => {
    const html = `<button data-i18n-title title="Tip">Label</button>`;
    // Only the title marker is present (no bare data-i18n), so only the tip is captured.
    expect(values(html)).toEqual(["Tip"]);
  });

  it("skips elements (and subtree) under data-i18n-ignore", () => {
    const html = `<a data-i18n-ignore><span>brand/repo</span></a><button data-i18n>Keep</button>`;
    expect(values(html)).toEqual(["Keep"]);
  });

  it("ignores raw-text element content (script/style)", () => {
    const html = `<script>const x = "<div>not text</div>";</script><button data-i18n>Go</button>`;
    expect(values(html)).toEqual(["Go"]);
  });

  it("reports 1-based line numbers", () => {
    const html = `<div>\n  <button data-i18n>Next</button>\n</div>`;
    expect(collectHtmlI18nStrings(html)).toEqual([{ value: "Next", line: 2 }]);
  });
});

describe("collectHtmlI18nLocations", () => {
  it("keys locations by uiStringHash and dedupes file:line", () => {
    const html = `<button data-i18n>Next</button>`;
    const locs = collectHtmlI18nLocations(html, "src/app/index.html");
    const h = uiStringHash("Next");
    expect(locs.get(h)).toEqual([{ file: "src/app/index.html", line: 1 }]);
  });
});

describe("markHtmlContent", () => {
  it("inserts a bare data-i18n on a leaf text element", () => {
    const { output, added } = markHtmlContent(`<button type="button">Next</button>`);
    expect(output).toBe(`<button type="button" data-i18n>Next</button>`);
    expect(added).toBe(1);
  });

  it("inserts bare title/placeholder markers and works on void/self-closing tags", () => {
    const { output } = markHtmlContent(`<input type="text" placeholder="Find" title="Search" />`);
    expect(output).toBe(
      `<input type="text" placeholder="Find" title="Search" data-i18n-title data-i18n-placeholder />`
    );
  });

  it("is idempotent (re-marking adds nothing)", () => {
    const once = markHtmlContent(`<button>Next</button>`).output;
    const twice = markHtmlContent(once);
    expect(twice.output).toBe(once);
    expect(twice.added).toBe(0);
  });

  it("does not mark code-like elements", () => {
    const { output, added } = markHtmlContent(`<code>npm run build</code>`);
    expect(output).toBe(`<code>npm run build</code>`);
    expect(added).toBe(0);
  });

  it("skips empty elements (dynamic placeholders) and numeric-only text", () => {
    const res = markHtmlContent(`<span id="page"></span><option value="25">25</option>`);
    expect(res.added).toBe(0);
    expect(res.output).toContain(`<span id="page"></span>`);
  });

  it("reports mixed-content elements instead of mangling them", () => {
    const res = markHtmlContent(`<p>Run <code>x</code> now.</p>`);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0]?.tag).toBe("p");
    expect(res.skipped[0]?.text).toBe("Run now.");
    // The <p> itself is not marked; the inner <code> is left alone.
    expect(res.output).toBe(`<p>Run <code>x</code> now.</p>`);
  });

  it("honors data-i18n-ignore subtree", () => {
    const res = markHtmlContent(`<a data-i18n-ignore><span>brand/repo</span></a>`);
    expect(res.added).toBe(0);
    expect(res.output).toBe(`<a data-i18n-ignore><span>brand/repo</span></a>`);
  });
});

describe("dashboard ground-truth (unmarked index.html fixture)", () => {
  const html = fs.readFileSync(FIXTURE, "utf8");

  it("auto-marks the clean leaves and reports the mixed-content paragraphs", () => {
    const res = markHtmlContent(html);
    expect(res.added).toBeGreaterThan(150);

    const skippedTexts = res.skipped.map((s) => s.text);
    expect(skippedTexts).toContain("Page size:");
    expect(skippedTexts).toContain("Force");
    expect(skippedTexts.some((t) => t.startsWith("Translation failures - prioritize"))).toBe(true);
    expect(skippedTexts.some((t) => t.startsWith("Static markdown checks"))).toBe(true);
    expect(skippedTexts.some((t) => t.startsWith("Start it again from your project"))).toBe(true);

    const captured = new Set(values(res.output));
    // Representative leaf / title / placeholder strings are captured.
    expect(captured.has("Documentation")).toBe(true);
    expect(captured.has("Save")).toBe(true);
    expect(captured.has("Stop the dashboard server and close this window")).toBe(true);
    expect(captured.has("Filename (partial)")).toBe(true);
    // Code snippets are never auto-marked.
    expect(captured.has("translate-docs")).toBe(false);
    expect(captured.has("ai-i18n-tools dashboard")).toBe(false);
  });
});
