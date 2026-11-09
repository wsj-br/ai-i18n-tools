import MarkdownIt, { type StateBlock, type Token } from "markdown-it";
import { container } from "@mdit/plugin-container";

const BACKTICK = 0x60;
const TILDE = 0x7e;
const COLON = 0x3a;
const CONTAINER_NAME = "colon";
const OPEN_TOKEN = `container_${CONTAINER_NAME}_open`;
const CLOSE_TOKEN = `container_${CONTAINER_NAME}_close`;

/**
 * A `:::` container recognized with the same block rules as `@mdit/plugin-container`
 * (VitePress custom containers): 0–3 spaces of indent, equal opener and closer columns,
 * list and blockquote markers, and a closing colon run at least as long as the opener.
 *
 * A colon run inside a fenced code block does not close the container. VitePress's own
 * container scan would, which splits samples such as a `::: note` shown inside ` ``` `.
 */
export interface ColonContainer {
  /** 0-based line of the opening fence. */
  startLine: number;
  /** 0-based inclusive last source line belonging to the container. */
  endLine: number;
  /** 0-based line of the explicit closer, or null when the block was auto-closed. */
  closerLine: number | null;
  /** Content column of the opener after list and blockquote adjustment. */
  indent: number;
  /** Length of the opener colon run. */
  colonCount: number;
  /** Length of the closer colon run, or null when the block was auto-closed. */
  closerColonCount: number | null;
  /** Text after the opener colon run. A leading space separates `::: tip` from the type. */
  info: string;
  children: ColonContainer[];
}

interface ColonContainerTokenMeta {
  explicit: boolean;
  closerColonCount: number | null;
  indent: number;
}

/**
 * True when the text after the colon run can open a container.
 * Accepts VitePress (` tip Title`), Docusaurus (`note[Title]`), Pandoc (` {.note}`),
 * and MyST (`{note} Title`) openers. A bare `:::` is a closer, not an opener.
 */
export function isColonContainerInfo(params: string): boolean {
  return /^[ \t]*(?:\w|\{)/.test(params);
}

function assignParentType(state: StateBlock, parentType: string): void {
  (state as { parentType: string }).parentType = parentType;
}

/**
 * Closing line of a fenced code block that opens at `startLine`, using Markdown-it's fence
 * rule. Returns null when the line is not a fence opener. An unclosed fence runs to the
 * last line of the parent range so a `:::` inside the sample cannot end the container.
 */
function codeFenceCloseLine(state: StateBlock, startLine: number, endLine: number): number | null {
  if (state.sCount[startLine]! - state.blkIndent >= 4) {
    return null;
  }
  let pos = state.bMarks[startLine]! + state.tShift[startLine]!;
  const max = state.eMarks[startLine]!;
  if (pos + 3 > max) {
    return null;
  }
  const marker = state.src.charCodeAt(pos);
  if (marker !== BACKTICK && marker !== TILDE) {
    return null;
  }
  const openStart = pos;
  pos = state.skipChars(pos, marker);
  const length = pos - openStart;
  if (length < 3) {
    return null;
  }
  if (marker === BACKTICK && state.src.slice(pos, max).includes("`")) {
    return null;
  }

  let nextLine = startLine;
  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      return Math.max(startLine, endLine - 1);
    }
    let closePos = state.bMarks[nextLine]! + state.tShift[nextLine]!;
    const closeMax = state.eMarks[nextLine]!;
    if (closePos < closeMax && state.sCount[nextLine]! < state.blkIndent) {
      return nextLine - 1;
    }
    if (state.src.charCodeAt(closePos) !== marker) {
      continue;
    }
    if (state.sCount[nextLine]! - state.blkIndent >= 4) {
      continue;
    }
    const closeStart = closePos;
    closePos = state.skipChars(closePos, marker);
    if (closePos - closeStart < length) {
      continue;
    }
    closePos = state.skipSpaces(closePos);
    if (closePos < closeMax) {
      continue;
    }
    return nextLine;
  }
}

/**
 * Container rule from `@mdit/plugin-container`, plus the fenced-code exception above.
 * Installed in the plugin's ruler slot so lists, quotes, and indentation stay Markdown-it's.
 */
function colonContainerRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean
): boolean {
  const contentStart = state.bMarks[startLine]! + state.tShift[startLine]!;
  const contentEnd = state.eMarks[startLine]!;
  if (state.src.charCodeAt(contentStart) !== COLON) {
    return false;
  }
  let cursor = contentStart + 1;
  while (cursor <= contentEnd && state.src.charCodeAt(cursor) === COLON) {
    cursor++;
  }
  const colonCount = cursor - contentStart;
  if (colonCount < 3) {
    return false;
  }
  const info = state.src.slice(cursor, contentEnd);
  if (!isColonContainerInfo(info)) {
    return false;
  }
  if (silent) {
    return true;
  }

  const indent = state.sCount[startLine]!;
  let nextLine = startLine + 1;
  let explicit = false;
  let closerColonCount: number | null = null;
  while (nextLine < endLine) {
    const fenceClose = codeFenceCloseLine(state, nextLine, endLine);
    if (fenceClose !== null) {
      nextLine = fenceClose + 1;
      continue;
    }
    const lineStart = state.bMarks[nextLine]! + state.tShift[nextLine]!;
    const lineEnd = state.eMarks[nextLine]!;
    if (lineStart < lineEnd && state.sCount[nextLine]! < indent) {
      break;
    }
    if (state.sCount[nextLine] === indent && state.src.charCodeAt(lineStart) === COLON) {
      let markerEnd = lineStart + 1;
      while (markerEnd <= lineEnd && state.src.charCodeAt(markerEnd) === COLON) {
        markerEnd++;
      }
      const closerCount = markerEnd - lineStart;
      if (closerCount >= colonCount && state.skipSpaces(markerEnd) >= lineEnd) {
        explicit = true;
        closerColonCount = closerCount;
        break;
      }
    }
    nextLine++;
  }

  const previousParent = state.parentType;
  const previousLineMax = state.lineMax;
  const previousIndent = state.blkIndent;
  assignParentType(state, "container");
  state.lineMax = nextLine;
  state.blkIndent = indent;

  const openToken = state.push(OPEN_TOKEN, "div", 1);
  openToken.markup = ":".repeat(colonCount);
  openToken.block = true;
  openToken.info = info;
  openToken.map = [startLine, nextLine];
  openToken.meta = {
    explicit,
    closerColonCount,
    indent,
  } satisfies ColonContainerTokenMeta;
  state.md.block.tokenize(state, startLine + 1, nextLine);

  const closeToken = state.push(CLOSE_TOKEN, "div", -1);
  closeToken.markup = openToken.markup;
  closeToken.block = true;

  assignParentType(state, previousParent);
  state.lineMax = previousLineMax;
  state.blkIndent = previousIndent;
  state.line = nextLine + (explicit ? 1 : 0);
  return true;
}

let colonMarkdown: MarkdownIt | null = null;

function getColonMarkdown(): MarkdownIt {
  if (colonMarkdown) {
    return colonMarkdown;
  }
  const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
  markdown.use(container, { name: CONTAINER_NAME });
  markdown.block.ruler.at("container_colon", colonContainerRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  colonMarkdown = markdown;
  return markdown;
}

function containersFromTokens(tokens: Token[]): ColonContainer[] {
  const roots: ColonContainer[] = [];
  const stack: ColonContainer[] = [];
  for (const token of tokens) {
    if (token.type === OPEN_TOKEN && token.map) {
      const meta = token.meta as ColonContainerTokenMeta;
      const explicit = meta.explicit;
      const node: ColonContainer = {
        startLine: token.map[0],
        endLine: explicit ? token.map[1] : token.map[1] - 1,
        closerLine: explicit ? token.map[1] : null,
        indent: meta.indent,
        colonCount: token.markup.length,
        closerColonCount: meta.closerColonCount,
        info: token.info,
        children: [],
      };
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
      stack.push(node);
      continue;
    }
    if (token.type === CLOSE_TOKEN) {
      stack.pop();
    }
  }
  return roots;
}

/** Top-level colon containers in `markdown`, each with nested containers in `children`. */
export function parseColonContainers(markdown: string): ColonContainer[] {
  const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const tokens = getColonMarkdown().parse(normalized, {});
  return containersFromTokens(tokens);
}

/** Containers in source order, parents before their children. */
export function flattenColonContainers(nodes: readonly ColonContainer[]): ColonContainer[] {
  const flat: ColonContainer[] = [];
  const walk = (list: readonly ColonContainer[]): void => {
    for (const node of list) {
      flat.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return flat;
}

/** True when `line` is inside a container but is not that container's opening fence. */
export function isColonContainerInterior(nodes: readonly ColonContainer[], line: number): boolean {
  return nodes.some((node) => line > node.startLine && line <= node.endLine);
}
