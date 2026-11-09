import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { container } from "@mdit/plugin-container";
import {
  flattenColonContainers,
  isColonContainerInfo,
  parseColonContainers,
  type ColonContainer,
} from "../../src/processors/colon-container-parser.js";

function sourceOf(markdown: string, node: ColonContainer): string {
  return markdown
    .split("\n")
    .slice(node.startLine, node.endLine + 1)
    .join("\n");
}

function stockOpenMaps(markdown: string): Array<[number, number]> {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  md.use(container, {
    name: "colon",
    validate: (params: string) => isColonContainerInfo(params),
  });
  return md
    .parse(markdown, {})
    .filter((token) => token.type === "container_colon_open" && token.map)
    .map((token) => token.map!);
}

describe("parseColonContainers", () => {
  it("accepts 0–3 spaces when the opener, body, and closer share that indent", () => {
    for (const indent of [0, 1, 2, 3]) {
      const pad = " ".repeat(indent);
      const markdown = [`${pad}::: info Title`, `${pad}Body.`, `${pad}:::`].join("\n");
      const containers = parseColonContainers(markdown);
      expect(containers).toHaveLength(1);
      expect(containers[0]).toMatchObject({
        closerLine: 2,
        indent,
        colonCount: 3,
        closerColonCount: 3,
        info: " info Title",
      });
      expect(sourceOf(markdown, containers[0]!)).toBe(markdown);
    }
  });

  it("leaves a four-space or tab-indented fence as indented code", () => {
    expect(parseColonContainers("    ::: info Title\n    Body.\n    :::")).toEqual([]);
    expect(parseColonContainers("\t::: info Title\n\tBody.\n\t:::")).toEqual([]);
  });

  it("auto-closes when the closer column does not match the opener", () => {
    const markdown = ["  ::: info Title", "  Body.", ":::"].join("\n");
    const containers = parseColonContainers(markdown);
    expect(containers).toHaveLength(1);
    expect(containers[0]).toMatchObject({ closerLine: null, endLine: 1, indent: 2 });
    expect(sourceOf(markdown, containers[0]!)).toBe("  ::: info Title\n  Body.");
  });

  it("parses containers inside lists and blockquotes", () => {
    const samples = [
      {
        markdown: ["- item", "", "  ::: info Title", "  Body.", "  :::"].join("\n"),
        source: ["  ::: info Title", "  Body.", "  :::"].join("\n"),
      },
      {
        markdown: ["- ::: info Title", "  Body.", "  :::"].join("\n"),
        source: ["- ::: info Title", "  Body.", "  :::"].join("\n"),
      },
      {
        markdown: ["- outer", "  - ::: info Title", "    Body.", "    :::"].join("\n"),
        source: ["  - ::: info Title", "    Body.", "    :::"].join("\n"),
      },
      {
        markdown: ["- outer", "  - inner", "", "    ::: info Title", "    Body.", "    :::"].join(
          "\n"
        ),
        source: ["    ::: info Title", "    Body.", "    :::"].join("\n"),
      },
      {
        markdown: ["> ::: info Title", "> Body.", "> :::"].join("\n"),
        source: ["> ::: info Title", "> Body.", "> :::"].join("\n"),
      },
      {
        markdown: ["> - ::: info Title", ">   Body.", ">   :::"].join("\n"),
        source: ["> - ::: info Title", ">   Body.", ">   :::"].join("\n"),
      },
    ];
    for (const sample of samples) {
      const containers = parseColonContainers(sample.markdown);
      expect(containers).toHaveLength(1);
      expect(containers[0]?.closerLine).not.toBeNull();
      expect(sourceOf(sample.markdown, containers[0]!)).toBe(sample.source);
    }
  });

  it("matches a longer closing run and leaves a shorter run inside an unclosed container", () => {
    const longer = ["::: tip T", "Body.", "::::", "After."].join("\n");
    const closed = parseColonContainers(longer);
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ closerLine: 2, closerColonCount: 4, endLine: 2 });
    expect(sourceOf(longer, closed[0]!)).toBe("::: tip T\nBody.\n::::");

    const shorter = [":::: tip T", "Body.", ":::", "After."].join("\n");
    const open = parseColonContainers(shorter);
    expect(open).toHaveLength(1);
    expect(open[0]).toMatchObject({ closerLine: null, colonCount: 4, endLine: 3 });
    expect(sourceOf(shorter, open[0]!)).toBe(shorter);
  });

  it("keeps nested containers and does not let a fence sample's colon run close them", () => {
    const nested = [
      "::::: info Parent",
      ":::: danger Child",
      "::: tip Deep",
      "Body.",
      ":::",
      "::::",
      ":::::",
    ].join("\n");
    const flat = flattenColonContainers(parseColonContainers(nested));
    expect(flat.map((node) => [node.colonCount, node.closerColonCount])).toEqual([
      [5, 5],
      [4, 4],
      [3, 3],
    ]);

    const fenced = ["::: note", "````md", "::: tip", "x", ":::", "````", "Done.", ":::"].join("\n");
    const containers = parseColonContainers(fenced);
    expect(containers).toHaveLength(1);
    expect(containers[0]?.children).toEqual([]);
    expect(containers[0]?.closerLine).toBe(7);
    expect(sourceOf(fenced, containers[0]!)).toBe(fenced);
  });

  it("accepts Docusaurus, Pandoc, MyST, and custom container openers", () => {
    const samples = [
      [":::note[Title]", "Body.", ":::"],
      ["::: {.note}", "Body.", ":::"],
      [":::{note} Title", "Body.", ":::"],
      ["::: code-group", "```js", "const x = 1;", "```", ":::"],
    ];
    for (const lines of samples) {
      const containers = parseColonContainers(lines.join("\n"));
      expect(containers).toHaveLength(1);
      expect(containers[0]?.closerLine).toBe(lines.length - 1);
    }
  });

  it("ignores a short colon run and a code fence that has not actually closed", () => {
    expect(parseColonContainers(":: note\nBody.")).toEqual([]);
    const indentedCloser = [
      "::: note",
      "```js",
      "const x = 1;",
      "    ```",
      "```",
      "Done.",
      ":::",
    ].join("\n");
    const trailingText = [
      "::: note",
      "```js",
      "const x = 1;",
      "``` trailing",
      "```",
      "Done.",
      ":::",
    ].join("\n");
    for (const markdown of [indentedCloser, trailingText]) {
      const containers = parseColonContainers(markdown);
      expect(containers).toHaveLength(1);
      expect(sourceOf(markdown, containers[0]!)).toBe(markdown);
      expect(containers[0]?.closerLine).toBe(6);
    }
  });

  it("agrees with @mdit/plugin-container when no fence contains a colon closer", () => {
    const markdown = [
      "Intro.",
      "",
      "  ::: info Title",
      "  Body.",
      "  :::",
      "",
      "- ::: warning Watch",
      "  Body.",
      "  :::",
      "",
      "> ::: tip Quoted",
      "> Body.",
      "> :::",
      "",
      "::::: info Parent",
      "::: danger Child",
      "Body.",
      ":::",
      ":::::",
    ].join("\n");
    const ours = flattenColonContainers(parseColonContainers(markdown)).map(
      (node) => [node.startLine, node.closerLine] as [number, number]
    );
    expect(stockOpenMaps(markdown)).toEqual(ours);
  });
});
