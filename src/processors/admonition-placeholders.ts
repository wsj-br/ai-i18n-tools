import {
  ADMONITION_BRACKETED_TITLE_RE,
  ADMONITION_CLOSING_RE,
  ADMONITION_DIRECTIVE_WITH_TAIL_RE,
  GITHUB_ALERT_LINE_RE,
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

    if (line.match(GITHUB_ALERT_LINE_RE)) {
      const placeholder = `${OPEN_PREFIX}${openIndex}${OPEN_SUFFIX}`;
      openMap.push(line);
      openIndex++;
      result.push(placeholder);
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
