const OPEN_PREFIX = "{{ADM_OPEN_";
const OPEN_SUFFIX = "}}";
const END_PREFIX = "{{ADM_END_";
const END_SUFFIX = "}}";

/** Same directive vocabulary as before; split into prefix (placeholder) + optional title remainder on the line. */
const ADMONITION_DIRECTIVE_WITH_TAIL =
  /^(\s*)(:::(?:note|tip|info|warning|danger|caution|important)(?:\[[^\]]*\])?)(\s*)([^\n]*)$/;

const ADMONITION_CLOSING = /^\s*(:::+)\s*$/;

const GITHUB_ALERT_LINE = /^\s*>\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;

export interface AdmonitionProtectedResult {
  protected: string;
  openMap: string[];
  endMap: string[];
}

export function protectAdmonitionSyntax(text: string): AdmonitionProtectedResult {
  const openMap: string[] = [];
  const endMap: string[] = [];
  let openIndex = 0;
  let endIndex = 0;

  const lines = text.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const openMatch = line.match(ADMONITION_DIRECTIVE_WITH_TAIL);
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

    if (line.match(GITHUB_ALERT_LINE)) {
      const placeholder = `${OPEN_PREFIX}${openIndex}${OPEN_SUFFIX}`;
      openMap.push(line);
      openIndex++;
      result.push(placeholder);
      continue;
    }

    const endMatch = line.match(ADMONITION_CLOSING);
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
  };
}

export function restoreAdmonitionSyntax(text: string, openMap: string[], endMap: string[]): string {
  let restored = text;

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
