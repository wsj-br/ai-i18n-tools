import type { DocsOutputConfig } from "./types.js";
import { matchesDocsOutputStylePreset } from "./docs-output-normalize.js";

export type FumadocsParserMode = "dot" | "dir";

/** Effective Fumadocs i18n parser (`dot` is the default). */
export function fumadocsParserMode(mo: DocsOutputConfig): FumadocsParserMode {
  return mo.fumadocsParser ?? "dot";
}

export function isFumadocsPreset(mo: DocsOutputConfig): boolean {
  return matchesDocsOutputStylePreset(mo, "fumadocs");
}

export function isFumadocsDotParser(mo: DocsOutputConfig): boolean {
  return isFumadocsPreset(mo) && fumadocsParserMode(mo) === "dot";
}

export function isFumadocsDirParser(mo: DocsOutputConfig): boolean {
  return isFumadocsPreset(mo) && fumadocsParserMode(mo) === "dir";
}
