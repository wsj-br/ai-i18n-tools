import {
  ADMONITION_BRACKETED_TITLE_RE,
  ADMONITION_CLOSING_RE,
  ADMONITION_DIRECTIVE_WITH_TAIL_RE,
  ADMONITION_FENCED_DIV_RE,
  GITHUB_ALERT_LINE_RE,
  MKDOCS_ADMONITION_OPENER_RE,
} from "./admonition-syntax.js";

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

export function protectAdmonitionSyntax(text: string): AdmonitionProtectedResult {
  const openMap: string[] = [];
  const endMap: string[] = [];
  const titleCloseMap: string[] = [];
  let openIndex = 0;
  let endIndex = 0;
  let titleCloseIndex = 0;

  const lines = text.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const bracketedMatch = line.match(ADMONITION_BRACKETED_TITLE_RE);
    if (bracketedMatch) {
      const indent = bracketedMatch[1]!;
      const openPrefix = bracketedMatch[2]!;
      const title = bracketedMatch[3]!;
      const closeRemainder = bracketedMatch[4]!;
      const openPlaceholder = `${OPEN_PREFIX}${openIndex}${OPEN_SUFFIX}`;
      const closePlaceholder = `${TCLOSE_PREFIX}${titleCloseIndex}${TCLOSE_SUFFIX}`;
      openMap.push(openPrefix);
      openIndex++;
      titleCloseMap.push(closeRemainder);
      titleCloseIndex++;
      result.push(`${indent}${openPlaceholder}${title}${closePlaceholder}`);
      continue;
    }

    const fencedDiv = line.match(ADMONITION_FENCED_DIV_RE);
    if (fencedDiv) {
      const indent = fencedDiv[1]!;
      const directive = fencedDiv[2]!;
      const spacing = fencedDiv[3]!;
      const titleRest = fencedDiv[4]!;
      const placeholder = `${OPEN_PREFIX}${openIndex}${OPEN_SUFFIX}`;
      const hasVisibleTitle = titleRest.trim().length > 0;
      openMap.push(hasVisibleTitle ? directive + spacing : directive);
      openIndex++;
      result.push(
        hasVisibleTitle ? `${indent}${placeholder}${titleRest}` : `${indent}${placeholder}`
      );
      continue;
    }

    const openMatch = line.match(ADMONITION_DIRECTIVE_WITH_TAIL_RE);
    if (openMatch) {
      const indent = openMatch[1]!;
      const directive = openMatch[2]!;
      const spacing = openMatch[3]!;
      const titleRest = openMatch[4]!;
      const placeholder = `${OPEN_PREFIX}${openIndex}${OPEN_SUFFIX}`;
      const hasVisibleTitle = titleRest.trim().length > 0;
      /** Directive plus delimiter space before title only when a title exists — restores `:::note Title`. */
      openMap.push(hasVisibleTitle ? directive + spacing : directive);
      openIndex++;
      result.push(
        hasVisibleTitle ? `${indent}${placeholder}${titleRest}` : `${indent}${placeholder}`
      );
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
      const placeholder = `${OPEN_PREFIX}${openIndex}${OPEN_SUFFIX}`;
      openIndex++;
      if (quoteOpen !== undefined && title !== undefined && quoteClose !== undefined) {
        const closePlaceholder = `${TCLOSE_PREFIX}${titleCloseIndex}${TCLOSE_SUFFIX}`;
        openMap.push(marker + classes + quoteOpen);
        titleCloseMap.push(quoteClose);
        titleCloseIndex++;
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
      const placeholder = `${OPEN_PREFIX}${openIndex}${OPEN_SUFFIX}`;
      const hasVisibleTitle = titleRest.trim().length > 0;
      openMap.push(hasVisibleTitle ? marker + spacing : line);
      openIndex++;
      result.push(hasVisibleTitle ? `${placeholder}${titleRest}` : placeholder);
      continue;
    }

    const endMatch = line.match(ADMONITION_CLOSING_RE);
    if (endMatch) {
      const placeholder = `${END_PREFIX}${endIndex}${END_SUFFIX}`;
      endMap.push(endMatch[1]);
      endIndex++;
      result.push(placeholder);
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
