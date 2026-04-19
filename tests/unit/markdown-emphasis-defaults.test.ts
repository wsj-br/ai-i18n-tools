import { describe, expect, it } from "vitest";
import {
  describeEmphasisPlaceholdersPolicy,
  localeUsesDefaultEmphasisPlaceholders,
  resolveMarkdownEmphasisPlaceholders,
  usesAutomaticEmphasisPlaceholdersForLocale,
} from "../../src/core/markdown-emphasis-defaults.js";
import type { DocumentationBlock } from "../../src/core/types.js";
import { primaryLanguageSubtag } from "../../src/core/locale-utils.js";

describe("primaryLanguageSubtag", () => {
  it("extracts primary subtag", () => {
    expect(primaryLanguageSubtag("zh-CN")).toBe("zh");
    expect(primaryLanguageSubtag("ja")).toBe("ja");
    expect(primaryLanguageSubtag("en_GB")).toBe("en");
  });
});

describe("localeUsesDefaultEmphasisPlaceholders", () => {
  it("is true for CJK primaries", () => {
    expect(localeUsesDefaultEmphasisPlaceholders("zh-CN", undefined)).toBe(true);
    expect(localeUsesDefaultEmphasisPlaceholders("ja-JP", undefined)).toBe(true);
    expect(localeUsesDefaultEmphasisPlaceholders("ko-KR", undefined)).toBe(true);
  });

  it("is true for common RTL primaries", () => {
    expect(localeUsesDefaultEmphasisPlaceholders("ar", undefined)).toBe(true);
    expect(localeUsesDefaultEmphasisPlaceholders("he-IL", undefined)).toBe(true);
    expect(localeUsesDefaultEmphasisPlaceholders("fa-IR", undefined)).toBe(true);
  });

  it("is false for typical LTR European locales", () => {
    expect(localeUsesDefaultEmphasisPlaceholders("de", undefined)).toBe(false);
    expect(localeUsesDefaultEmphasisPlaceholders("en-GB", undefined)).toBe(false);
    expect(localeUsesDefaultEmphasisPlaceholders("fr-FR", undefined)).toBe(false);
  });

  it("matches rtlLocales when primary is not in the built-in RTL set", () => {
    expect(localeUsesDefaultEmphasisPlaceholders("dv-MV", undefined)).toBe(true); // built-in
    expect(localeUsesDefaultEmphasisPlaceholders("arc", ["arc"])).toBe(true);
    expect(localeUsesDefaultEmphasisPlaceholders("arc-Syrc", ["arc"])).toBe(true);
  });
});

describe("resolveMarkdownEmphasisPlaceholders", () => {
  const doc = (p?: boolean): DocumentationBlock =>
    ({
      contentPaths: [],
      outputDir: "./out",
      markdownOutput: { style: "nested", flatPreserveRelativeDir: false },
      ...(p !== undefined ? { emphasisPlaceholders: p } : {}),
    }) as DocumentationBlock;

  it("respects explicit documentation.emphasisPlaceholders over locale and CLI", () => {
    expect(
      resolveMarkdownEmphasisPlaceholders("de", doc(false), {}, { emphasisPlaceholdersCli: true })
    ).toBe(false);
    expect(
      resolveMarkdownEmphasisPlaceholders("ja", doc(true), {}, { noEmphasisPlaceholdersCli: true })
    ).toBe(true);
  });

  it("uses CLI when documentation omits emphasisPlaceholders", () => {
    expect(resolveMarkdownEmphasisPlaceholders("de", doc(), {}, { emphasisPlaceholdersCli: true })).toBe(
      true
    );
    expect(
      resolveMarkdownEmphasisPlaceholders("ja", doc(), {}, { noEmphasisPlaceholdersCli: true })
    ).toBe(false);
  });

  it("falls back to locale heuristic when nothing else applies", () => {
    expect(resolveMarkdownEmphasisPlaceholders("ja", doc(), {}, {})).toBe(true);
    expect(resolveMarkdownEmphasisPlaceholders("de", doc(), {}, {})).toBe(false);
  });
});

describe("usesAutomaticEmphasisPlaceholdersForLocale", () => {
  const doc = (p?: boolean): DocumentationBlock =>
    ({
      contentPaths: [],
      outputDir: "./out",
      markdownOutput: { style: "nested", flatPreserveRelativeDir: false },
      ...(p !== undefined ? { emphasisPlaceholders: p } : {}),
    }) as DocumentationBlock;

  it("is true only for heuristic-on locales without config or CLI", () => {
    expect(usesAutomaticEmphasisPlaceholdersForLocale("ja", doc(), {}, {})).toBe(true);
    expect(usesAutomaticEmphasisPlaceholdersForLocale("de", doc(), {}, {})).toBe(false);
    expect(
      usesAutomaticEmphasisPlaceholdersForLocale("ja", doc(true), {}, {})
    ).toBe(false);
    expect(
      usesAutomaticEmphasisPlaceholdersForLocale("ja", doc(), {}, { emphasisPlaceholdersCli: true })
    ).toBe(false);
    expect(
      usesAutomaticEmphasisPlaceholdersForLocale("ja", doc(), {}, { noEmphasisPlaceholdersCli: true })
    ).toBe(false);
  });
});

describe("describeEmphasisPlaceholdersPolicy", () => {
  it("summarizes policy source", () => {
    const base: DocumentationBlock = {
      contentPaths: [],
      outputDir: "./out",
      markdownOutput: { style: "nested", flatPreserveRelativeDir: false },
    } as DocumentationBlock;
    expect(describeEmphasisPlaceholdersPolicy({ ...base, emphasisPlaceholders: true }, {})).toContain(
      "documentations"
    );
    expect(describeEmphasisPlaceholdersPolicy(base, { emphasisPlaceholdersCli: true })).toContain(
      "--emphasis-placeholders"
    );
    expect(describeEmphasisPlaceholdersPolicy(base, {})).toContain("auto");
  });
});
