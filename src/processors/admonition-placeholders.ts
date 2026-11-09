import {
  ADMONITION_BRACKETED_TITLE_RE,
  ADMONITION_CLOSING_RE,
  ADMONITION_DIRECTIVE_WITH_TAIL_RE,
  ADMONITION_FENCED_DIV_RE,
  GITHUB_ALERT_LINE_RE,
  MKDOCS_ADMONITION_OPENER_RE,
} from "./admonition-syntax.js";
import {
  flattenColonContainers,
  parseColonContainers,
  type ColonContainer,
} from "./colon-container-parser.js";

const OPEN_PREFIX = "{{ADM_OPEN_";
const OPEN_SUFFIX = "}}";
const END_PREFIX = "{{ADM_END_";
const END_SUFFIX = "}}";
const TCLOSE_PREFIX = "{{ADM_TCLOSE_";
const TCLOSE_SUFFIX = "}}";

export interface AdmonitionProtectedResult {
  protected: string;
  openMap: string[];
  endMap: string[];
  /** Restores the `]`/attribute remainder of bracketed-title openers (`{{ADM_TCLOSE_n}}`). */
  titleCloseMap: string[];
}

interface AdmonitionProtectState {
  openMap: string[];
  titleCloseMap: string[];
  openIndex: number;
  titleCloseIndex: number;
}

function findColonRun(line: string, colonCount: number): number {
  const markup = ":".repeat(colonCount);
  let from = 0;
  while (from <= line.length - colonCount) {
    const at = line.indexOf(markup, from);
    if (at < 0) {
      return -1;
    }
    const before = at > 0 ? line[at - 1] : "";
    const after = line[at + colonCount] ?? "";
    if (before !== ":" && after !== ":") {
      return at;
    }
    from = at + 1;
  }
  return -1;
}

/**
 * Mask a fence that starts at the colon run. `null` when the line is not one of the titled
 * container forms (for example `::: code-group`, which is copied through unchanged).
 */
function protectFence(fence: string, state: AdmonitionProtectState): string | null {
  const bracketedMatch = fence.match(ADMONITION_BRACKETED_TITLE_RE);
  if (bracketedMatch) {
    const indent = bracketedMatch[1]!;
    const openPrefix = bracketedMatch[2]!;
    const title = bracketedMatch[3]!;
    const closeRemainder = bracketedMatch[4]!;
    const openPlaceholder = `${OPEN_PREFIX}${state.openIndex}${OPEN_SUFFIX}`;
    const closePlaceholder = `${TCLOSE_PREFIX}${state.titleCloseIndex}${TCLOSE_SUFFIX}`;
    state.openMap.push(openPrefix);
    state.openIndex++;
    state.titleCloseMap.push(closeRemainder);
    state.titleCloseIndex++;
    return `${indent}${openPlaceholder}${title}${closePlaceholder}`;
  }

  const fencedDiv = fence.match(ADMONITION_FENCED_DIV_RE);
  if (fencedDiv) {
    const indent = fencedDiv[1]!;
    const directive = fencedDiv[2]!;
    const spacing = fencedDiv[3]!;
    const titleRest = fencedDiv[4]!;
    const placeholder = `${OPEN_PREFIX}${state.openIndex}${OPEN_SUFFIX}`;
    const hasVisibleTitle = titleRest.trim().length > 0;
    state.openMap.push(hasVisibleTitle ? directive + spacing : directive);
    state.openIndex++;
    return hasVisibleTitle ? `${indent}${placeholder}${titleRest}` : `${indent}${placeholder}`;
  }

  const openMatch = fence.match(ADMONITION_DIRECTIVE_WITH_TAIL_RE);
  if (openMatch) {
    const indent = openMatch[1]!;
    const directive = openMatch[2]!;
    const spacing = openMatch[3]!;
    const titleRest = openMatch[4]!;
    const placeholder = `${OPEN_PREFIX}${state.openIndex}${OPEN_SUFFIX}`;
    const hasVisibleTitle = titleRest.trim().length > 0;
    /** Directive plus delimiter space before title only when a title exists — restores `:::note Title`. */
    state.openMap.push(hasVisibleTitle ? directive + spacing : directive);
    state.openIndex++;
    return hasVisibleTitle ? `${indent}${placeholder}${titleRest}` : `${indent}${placeholder}`;
  }

  return null;
}

function protectParsedOpener(
  line: string,
  opener: ColonContainer,
  state: AdmonitionProtectState
): string {
  const at = findColonRun(line, opener.colonCount);
  if (at < 0) {
    return line;
  }
  const rewritten = protectFence(line.slice(at), state);
  if (rewritten === null) {
    return line;
  }
  return line.slice(0, at) + rewritten;
}

export function protectAdmonitionSyntax(text: string): AdmonitionProtectedResult {
  const openMap: string[] = [];
  const endMap: string[] = [];
  const titleCloseMap: string[] = [];
  const state: AdmonitionProtectState = {
    openMap,
    titleCloseMap,
    openIndex: 0,
    titleCloseIndex: 0,
  };
  let endIndex = 0;

  const containers = flattenColonContainers(parseColonContainers(text));
  const openers = new Map(containers.map((node) => [node.startLine, node]));
  const closers = new Set(
    containers.flatMap((node) => (node.closerLine === null ? [] : [node.closerLine]))
  );

  const lines = text.split("\n");
  const result: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const opener = openers.get(index);
    if (opener) {
      result.push(protectParsedOpener(line, opener, state));
      continue;
    }

    if (closers.has(index) || ADMONITION_CLOSING_RE.test(line)) {
      const placeholder = `${END_PREFIX}${endIndex}${END_SUFFIX}`;
      endMap.push(line);
      endIndex++;
      result.push(placeholder);
      continue;
    }

    const rewrittenFence = protectFence(line, state);
    if (rewrittenFence !== null) {
      result.push(rewrittenFence);
      continue;
    }

    const mkdocsMatch = line.match(MKDOCS_ADMONITION_OPENER_RE);
    if (mkdocsMatch) {
      const indent = mkdocsMatch[1]!;
      const marker = mkdocsMatch[2]!;
      const classes = mkdocsMatch[3]!;
      const quoteOpen = mkdocsMatch[4];
      const title = mkdocsMatch[5];
      const quoteClose = mkdocsMatch[6];
      const placeholder = `${OPEN_PREFIX}${state.openIndex}${OPEN_SUFFIX}`;
      state.openIndex++;
      if (quoteOpen !== undefined && title !== undefined && quoteClose !== undefined) {
        const closePlaceholder = `${TCLOSE_PREFIX}${state.titleCloseIndex}${TCLOSE_SUFFIX}`;
        openMap.push(marker + classes + quoteOpen);
        titleCloseMap.push(quoteClose);
        state.titleCloseIndex++;
        result.push(`${indent}${placeholder}${title}${closePlaceholder}`);
      } else {
        openMap.push(marker + classes);
        result.push(`${indent}${placeholder}`);
      }
      continue;
    }

    const githubMatch = line.match(GITHUB_ALERT_LINE_RE);
    if (githubMatch) {
      const marker = githubMatch[1]!;
      const spacing = githubMatch[2] ?? "";
      const titleRest = githubMatch[3] ?? "";
      const placeholder = `${OPEN_PREFIX}${state.openIndex}${OPEN_SUFFIX}`;
      const hasVisibleTitle = titleRest.trim().length > 0;
      openMap.push(hasVisibleTitle ? marker + spacing : line);
      state.openIndex++;
      result.push(hasVisibleTitle ? `${placeholder}${titleRest}` : placeholder);
      continue;
    }

    result.push(line);
  }

  return {
    protected: result.join("\n"),
    openMap,
    endMap,
    titleCloseMap,
  };
}

export function restoreAdmonitionSyntax(
  text: string,
  openMap: string[],
  endMap: string[],
  titleCloseMap: string[] = []
): string {
  let restored = text;

  for (let i = 0; i < titleCloseMap.length; i++) {
    const flexible = new RegExp(`\\{\\{\\s*ADM_TCLOSE_${i}\\s*\\}\\}`, "g");
    restored = restored.replace(flexible, titleCloseMap[i]);
  }

  for (let i = 0; i < endMap.length; i++) {
    const flexible = new RegExp(`\\{\\{\\s*ADM_END_${i}\\s*\\}\\}`, "g");
    restored = restored.replace(flexible, endMap[i]);
  }

  for (let i = 0; i < openMap.length; i++) {
    const flexible = new RegExp(`\\{\\{\\s*ADM_OPEN_${i}\\s*\\}\\}`, "g");
    restored = restored.replace(flexible, openMap[i]);
  }

  return restored;
}
