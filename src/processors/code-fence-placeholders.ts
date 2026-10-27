import { isCodeFenceClose, matchCodeFenceOpen } from "./code-fence.js";

/**
 * Replace each closed CommonMark fenced code block with {{CDF_N}} before translation.
 * The whole fence, including its info string, is structural: the model must keep every
 * token once and in order. Restore injects the original block.
 *
 * An unclosed opener is left in place so a later container closer is not swallowed.
 */

const PLACEHOLDER_PREFIX = "{{CDF_";
const PLACEHOLDER_SUFFIX = "}}";

export interface ProtectedCodeFenceResult {
  protected: string;
  codeFenceMap: string[];
}

export function protectFencedCodeBlocks(text: string): ProtectedCodeFenceResult {
  const lines = text.split("\n");
  const codeFenceMap: string[] = [];
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const open = matchCodeFenceOpen(lines[i] ?? "");
    if (!open) {
      out.push(lines[i] ?? "");
      i++;
      continue;
    }

    let j = i + 1;
    while (j < lines.length && !isCodeFenceClose(lines[j] ?? "", open)) {
      j++;
    }
    if (j >= lines.length) {
      out.push(lines[i] ?? "");
      i++;
      continue;
    }

    const block = lines.slice(i, j + 1).join("\n");
    codeFenceMap.push(block);
    out.push(`${PLACEHOLDER_PREFIX}${codeFenceMap.length - 1}${PLACEHOLDER_SUFFIX}`);
    i = j + 1;
  }

  return { protected: out.join("\n"), codeFenceMap };
}

export function restoreFencedCodeBlocks(text: string, codeFenceMap: string[]): string {
  let restored = text;
  for (let i = 0; i < codeFenceMap.length; i++) {
    const flexible = new RegExp(`\\{\\{\\s*CDF_${i}\\s*\\}\\}`, "g");
    restored = restored.replace(flexible, () => codeFenceMap[i] ?? "");
  }
  return restored;
}
