import type { Glossary } from "./glossary.js";

/**
 * Thin wrapper for prompt integration (plan §3.3 matching API).
 */
export class GlossaryMatcher {
  constructor(private readonly glossary: Glossary) {}

  findTermsInText(
    text: string,
    locale: string,
    opts?: { skipUiAbbreviations?: boolean }
  ): string[] {
    return this.glossary.findTermsInText(text, locale, opts);
  }
}
