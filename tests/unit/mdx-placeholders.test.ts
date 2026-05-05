import { describe, expect, it } from "vitest";
import { protectMdx, restoreMdx } from "../../src/processors/mdx-placeholders.js";

describe("mdx-placeholders", () => {
  it("protects and restores an MDX heading-id comment", () => {
    const src = "### Hello World {/* #my-explicit-id */}";
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual(["{/* #my-explicit-id */}"]);
    expect(p).toBe("### Hello World {{MDX_0}}");
    expect(restoreMdx(p, mdxMap)).toBe(src);
  });

  it("protects and restores generic MDX comments anywhere in prose", () => {
    const src = "Before {/* TODO: refactor */} after.";
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual(["{/* TODO: refactor */}"]);
    expect(p).toBe("Before {{MDX_0}} after.");
    expect(restoreMdx(p, mdxMap)).toBe(src);
  });

  it("protects opener and closer of a capitalized JSX tag separately so inner text is visible", () => {
    const src = `Use <Highlight color="#25c2a0">Docusaurus green</Highlight> in prose.`;
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual([`<Highlight color="#25c2a0">`, "</Highlight>"]);
    expect(p).toBe("Use {{MDX_0}}Docusaurus green{{MDX_1}} in prose.");
    expect(restoreMdx(p, mdxMap)).toBe(src);
  });

  it("protects a self-closing capitalized JSX component", () => {
    const src = "Above\n<TOCInline toc={toc} />\nBelow";
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual(["<TOCInline toc={toc} />"]);
    expect(p).toBe("Above\n{{MDX_0}}\nBelow");
    expect(restoreMdx(p, mdxMap)).toBe(src);
  });

  it("treats prop with `style={{…}}` as part of the opening tag (no leftover braces)", () => {
    const src = `<Box style={{padding: 0, color: "red"}}>x</Box>`;
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual([`<Box style={{padding: 0, color: "red"}}>`, "</Box>"]);
    expect(p).toBe("{{MDX_0}}x{{MDX_1}}");
    expect(restoreMdx(p, mdxMap)).toBe(src);
  });

  it("protects depth-aware inline brace expressions", () => {
    const src = "The title is {frontMatter.title} and entries are {Object.entries({a: 1})}.";
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual(["{frontMatter.title}", "{Object.entries({a: 1})}"]);
    expect(p).toBe("The title is {{MDX_0}} and entries are {{MDX_1}}.");
    expect(restoreMdx(p, mdxMap)).toBe(src);
  });

  it("does not consume existing {{HDG_N}} / {{HTM_N}} placeholders", () => {
    const src = "### Hello {{HDG_0}} and {value} and {{HTM_3}}";
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual(["{value}"]);
    expect(p).toBe("### Hello {{HDG_0}} and {{MDX_0}} and {{HTM_3}}");
    expect(restoreMdx(p, mdxMap)).toBe(src);
  });

  it("leaves an unbalanced lone `{` alone (no false-positive match)", () => {
    const src = "open { without close";
    const { protected: p, mdxMap } = protectMdx(src);
    expect(mdxMap).toEqual([]);
    expect(p).toBe(src);
  });

  it("restoreMdx accepts the lenient `{{MDX-N}}` hyphen form", () => {
    const corrupted = "before {{MDX-0}} after";
    expect(restoreMdx(corrupted, ["{value}"])).toBe("before {value} after");
  });

  it("round-trips a paragraph with comments + JSX + expressions together", () => {
    const src = `### Heading {/* #my-id */}\n\nUse <Highlight color="green">{frontMatter.title}</Highlight> here.`;
    const { protected: p, mdxMap } = protectMdx(src);
    expect(restoreMdx(p, mdxMap)).toBe(src);
    expect(p).not.toContain("/*");
    expect(p).not.toContain("<Highlight");
  });

  // New tests for JSX attribute extraction
  it("merges translated ||JXA_N|| appendix values back into JSX tags", () => {
    const src = `<Tabs>\n<TabItem value="a" label="First tab label">\nBody\n</TabItem>\n</Tabs>`;
    const { protected: p, mdxMap, jsxAttributeMap, jsxAttributeText } = protectMdx(src);
    expect(jsxAttributeText).toContain("||JXA0: First tab label||");
    expect(mdxMap.some((m) => m.includes('label="{{JXA_0}}'))).toBe(true);

    const simulatedTarget = `${p}\n||JXA0: Primeira aba||`;
    const restored = restoreMdx(simulatedTarget, mdxMap, jsxAttributeMap);
    expect(restored).toContain('label="Primeira aba"');
    expect(restored).not.toContain("{{JXA_");
    expect(restored).not.toContain("||JXA");
  });

  it("extracts label attribute from TabItem and replaces with JXA placeholder", () => {
    const src = `<TabItem value="apple" label="Apple">Content</TabItem>`;
    const { protected: p, mdxMap, jsxAttributeMap } = protectMdx(src);

    // Should have extracted "Apple" as attribute and replaced with JXA placeholder
    expect(jsxAttributeMap).toBeDefined();
    expect(jsxAttributeMap).toContain("Apple");

    // The label attribute in the JSX tag should be replaced with JXA placeholder
    const tagWithJxa = mdxMap.find((m) => m.includes("{{JXA_"));
    expect(tagWithJxa).toBeDefined();

    // Restore should bring back the original
    const restored = restoreMdx(p, mdxMap, jsxAttributeMap);
    expect(restored).toBe(src);
  });

  it("extracts multiple attributes from JSX tags", () => {
    const src = `<TabItem value="win" label="Windows" tooltip="Windows OS">Use Ctrl + C.</TabItem>`;
    const { protected: p, mdxMap, jsxAttributeMap } = protectMdx(src);

    expect(jsxAttributeMap).toBeDefined();
    expect(jsxAttributeMap).toContain("Windows");
    expect(jsxAttributeMap).toContain("Windows OS");

    const restored = restoreMdx(p, mdxMap, jsxAttributeMap);
    expect(restored).toBe(src);
  });

  it("extracts aria-label attribute", () => {
    const src = `<Tabs aria-label="Operating System Tabs">\n<TabItem value="mac">macOS</TabItem>\n</Tabs>`;
    const { protected: p, mdxMap, jsxAttributeMap } = protectMdx(src);

    expect(jsxAttributeMap).toBeDefined();
    expect(jsxAttributeMap).toContain("Operating System Tabs");

    const restored = restoreMdx(p, mdxMap, jsxAttributeMap);
    expect(restored).toBe(src);
  });

  it("skips non-translatable attribute values", () => {
    const src = `<TabItem value="a" label="1">Content</TabItem>`;
    const { jsxAttributeMap } = protectMdx(src);

    // "1" should be skipped (numbers are not translatable)
    expect(jsxAttributeMap).toBeUndefined();
  });

  it("processes multiple TabItem tags with attributes", () => {
    const src = `<Tabs>\n<TabItem value="apple" label="Apple">\nThis is an apple 🍎\n</TabItem>\n<TabItem value="orange" label="Orange">\nThis is an orange 🍊\n</TabItem>\n</Tabs>`;
    const { protected: p, mdxMap, jsxAttributeMap } = protectMdx(src);

    expect(jsxAttributeMap).toBeDefined();
    expect(jsxAttributeMap).toContain("Apple");
    expect(jsxAttributeMap).toContain("Orange");

    const restored = restoreMdx(p, mdxMap, jsxAttributeMap);
    expect(restored).toBe(src);
  });

  it("handles mixed content with translated attributes", () => {
    const src = `## Tabs Example\n\n<Tabs>\n<TabItem value="ios" label="iOS" tooltip="Apple mobile">iOS content</TabItem>\n<TabItem value="android" label="Android">Android content</TabItem>\n</Tabs>\n\nMore text here.`;
    const { protected: p, mdxMap, jsxAttributeMap } = protectMdx(src);

    expect(jsxAttributeMap).toBeDefined();
    expect(jsxAttributeMap).toContain("iOS");
    expect(jsxAttributeMap).toContain("Apple mobile");
    expect(jsxAttributeMap).toContain("Android");

    const restored = restoreMdx(p, mdxMap, jsxAttributeMap);
    expect(restored).toBe(src);
  });

  it("translates TabItem value when there is no label (display-like values)", () => {
    const src = `<Tabs className="x">\n  <TabItem value="Apple">This is an apple 🍎</TabItem>\n  <TabItem value="Orange">Orange</TabItem>\n</Tabs>`;
    const { protected: p, mdxMap, jsxAttributeMap } = protectMdx(src);
    expect(jsxAttributeMap).toEqual(["Apple", "Orange"]);
    expect(mdxMap.some((m) => m.includes('value="{{JXA_0}}'))).toBe(true);
    const restored = restoreMdx(p, mdxMap, jsxAttributeMap);
    expect(restored).toBe(src);
  });

  it("does not translate TabItem value when it looks like a lowercase slug (matches values array keys)", () => {
    const src = `<Tabs defaultValue="apple" values={[{ label: 'Apple', value: 'apple' }]}>\n  <TabItem value="apple">Body</TabItem>\n</Tabs>`;
    const { jsxAttributeMap, mdxMap } = protectMdx(src);
    expect(jsxAttributeMap).toContain("Apple");
    expect(jsxAttributeMap).not.toContain("apple");
    const tabItem = mdxMap.find((m) => m.includes("TabItem"));
    expect(tabItem).toBeDefined();
    expect(tabItem).toContain('value="apple"');
  });

  it("translates label: strings inside Tabs values={[ … ]} objects", () => {
    const src = `<Tabs
  defaultValue="apple"
  values={[
    {label: 'Apple', value: 'apple'},
    {label: 'Orange', value: 'orange'},
  ]}>
  <TabItem value="apple">x</TabItem>
</Tabs>`;
    const { mdxMap, jsxAttributeMap } = protectMdx(src);
    expect(jsxAttributeMap).toEqual(["Apple", "Orange"]);
    const tabsOpener = mdxMap.find((m) => m.startsWith("<Tabs"));
    expect(tabsOpener).toBeDefined();
    expect(tabsOpener).toContain("label: '{{JXA_0}}'");
    expect(tabsOpener).toContain("label: '{{JXA_1}}'");
    expect(tabsOpener).toContain("value: 'apple'");
  });
});
