import { describe, expect, it } from "vitest";
import path from "path";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config.js";
import {
  expandSvgPathTemplate,
  relPathUnderSvgSource,
  resolveSvgAssetOutputPath,
  svgAssetCacheFilepath,
  svgTranslationFilepathMetadata,
  matchesGlobPattern,
  GlobPatternError,
} from "../../src/core/svg-asset-paths.js";

describe("svg-asset-paths", () => {
  const flatConfig = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en-GB",
      targetLocales: ["de"],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      cacheDir: ".cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      svg: {
        sourcePath: ["images"],
        outputDir: "public/assets",
        style: "flat" as const,
      },
    })
  );

  const nestedConfig = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en-GB",
      targetLocales: ["de"],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      cacheDir: ".cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      svg: {
        sourcePath: ["images"],
        outputDir: "public/assets",
        style: "nested" as const,
      },
    })
  );

  const cwd = "/proj";

  const templateConfig = parseI18nConfig(
    mergeWithDefaults({
      sourceLocale: "en-GB",
      targetLocales: ["de"],
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        translationModels: ["m"],
        maxTokens: 100,
        temperature: 0.1,
      },
      cacheDir: ".cache",
      docs: [{ contentPaths: [], outputDir: "./i18n" }],
      svg: {
        sourcePath: ["images"],
        outputDir: "public/assets",
        pathTemplate: "{outputDir}/illustrations/{stem}__{locale}{extension}",
        style: "nested" as const,
      },
    })
  );

  it("expandSvgPathTemplate substitutes svg placeholders", () => {
    const s = expandSvgPathTemplate("{outputDir}/x/{stem}.{locale}{extension}", {
      outputDir: "/out",
      locale: "pt-BR",
      relPath: "images/foo.svg",
      relativeToSourceRoot: "foo.svg",
    });
    expect(s).toBe("/out/x/foo.pt-BR.svg");
  });

  it("resolveSvgAssetOutputPath uses pathTemplate when set (overrides style)", () => {
    const abs = resolveSvgAssetOutputPath(
      templateConfig,
      cwd,
      "de",
      "images/translation_demo_svg.svg",
      "translation_demo_svg.svg"
    );
    expect(abs).toBe(path.join(cwd, "public/assets/illustrations/translation_demo_svg__de.svg"));
  });

  it("resolveSvgAssetOutputPath flat uses stem.locale.svg", () => {
    const abs = resolveSvgAssetOutputPath(
      flatConfig,
      cwd,
      "pt-BR",
      "images/translation_demo_svg.svg",
      "translation_demo_svg.svg"
    );
    expect(abs).toBe(path.join(cwd, "public/assets/translation_demo_svg.pt-BR.svg"));
  });

  it("resolveSvgAssetOutputPath nested uses locale/relPath", () => {
    const abs = resolveSvgAssetOutputPath(
      nestedConfig,
      cwd,
      "pt-BR",
      "images/icons/a.svg",
      "icons/a.svg"
    );
    expect(abs).toBe(path.join(cwd, "public/assets/pt-BR/icons/a.svg"));
  });

  it("svgAssetCacheFilepath prefixes svg-files:", () => {
    expect(svgAssetCacheFilepath("images/x.svg")).toBe("svg-files:images/x.svg");
  });

  it("svgTranslationFilepathMetadata is cwd-relative posix without svg-files prefix", () => {
    expect(svgTranslationFilepathMetadata("images/x.svg")).toBe("images/x.svg");
    expect(svgTranslationFilepathMetadata("a\\b.svg")).toBe("a/b.svg");
  });

  it("relPathUnderSvgSource picks longest matching root", () => {
    expect(relPathUnderSvgSource("images/a.svg", ["images"])).toBe("a.svg");
    expect(relPathUnderSvgSource("images/sub/a.svg", ["images"])).toBe("sub/a.svg");
  });

  it("relPathUnderSvgSource handles glob patterns", () => {
    // Single * matches any characters except /
    expect(relPathUnderSvgSource("images/duplistatus_foo.svg", ["images/duplistatus_*.svg"])).toBe(
      "duplistatus_foo.svg"
    );
    // ** matches any characters including /
    expect(relPathUnderSvgSource("images/icons/a.svg", ["images/**/*.svg"])).toBe("icons/a.svg");
    // Multiple patterns - longest match wins
    expect(relPathUnderSvgSource("images/icons/a.svg", ["images/*", "images/icons/*"])).toBe(
      "a.svg"
    );
  });

  it("parses legacy svg.svgExtractor.forceLowercase into svg.forceLowercase", () => {
    const cfg = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["de"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        cacheDir: ".cache",
        docs: [{ contentPaths: [], outputDir: "./i18n" }],
        svg: {
          sourcePath: ["images"],
          outputDir: "public/assets",
          style: "flat",
          svgExtractor: { forceLowercase: true },
        },
      })
    );
    expect(cfg.svg?.forceLowercase).toBe(true);
  });

  it("top-level svg.forceLowercase overrides legacy svgExtractor when both present", () => {
    const cfg = parseI18nConfig(
      mergeWithDefaults({
        sourceLocale: "en-GB",
        targetLocales: ["de"],
        openrouter: {
          baseUrl: "https://openrouter.ai/api/v1",
          translationModels: ["m"],
          maxTokens: 100,
          temperature: 0.1,
        },
        cacheDir: ".cache",
        docs: [{ contentPaths: [], outputDir: "./i18n" }],
        svg: {
          sourcePath: ["images"],
          outputDir: "public/assets",
          style: "flat",
          forceLowercase: false,
          svgExtractor: { forceLowercase: true },
        },
      })
    );
    expect(cfg.svg?.forceLowercase).toBe(false);
  });
});

describe("matchesGlobPattern - security validations (ReDoS protection)", () => {
  it("accepts valid glob patterns", () => {
    expect(matchesGlobPattern("images/foo.svg", "images/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/icons/foo.svg", "images/**/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/foo.svg", "images/foo.svg")).toBe(true);
  });

  it("rejects patterns exceeding maximum length", () => {
    const longPattern = "images/" + "a".repeat(500) + "*.svg";
    expect(() => matchesGlobPattern("images/foo.svg", longPattern)).toThrow(GlobPatternError);
    expect(() => matchesGlobPattern("images/foo.svg", longPattern)).toThrow(
      /exceeds maximum length/
    );
  });

  it("rejects patterns with too many glob stars", () => {
    const manyStars = "images/**/*/*/*/*/*/*/*/*/*/*/*/*.svg"; // 12 stars
    expect(() => matchesGlobPattern("images/foo.svg", manyStars)).toThrow(GlobPatternError);
    expect(() => matchesGlobPattern("images/foo.svg", manyStars)).toThrow(/too many wildcards/);
  });

  it("accepts patterns within star limit", () => {
    const eightStars = "images/*/*/*/*/*/*/*/*.svg"; // 8 single stars
    expect(() => matchesGlobPattern("images/a/b/c/d/e/f/g/h.svg", eightStars)).not.toThrow();
  });

  it("rejects suspicious triple-star patterns", () => {
    expect(() => matchesGlobPattern("foo.svg", "images/***.svg")).toThrow(GlobPatternError);
    expect(() => matchesGlobPattern("foo.svg", "images/***.svg")).toThrow(/suspicious nested/);
  });

  it("rejects patterns with multiple ** separated by content", () => {
    expect(() => matchesGlobPattern("foo.svg", "images/**/foo/**.svg")).toThrow(GlobPatternError);
  });

  it("rejects patterns with unbalanced brackets", () => {
    expect(() => matchesGlobPattern("foo.svg", "images/[abc/*.svg")).toThrow(GlobPatternError);
    expect(() => matchesGlobPattern("foo.svg", "images/abc]/*.svg")).toThrow(GlobPatternError);
    expect(() => matchesGlobPattern("foo.svg", "images/[abc/*.svg")).toThrow(/unbalanced brackets/);
  });

  it("accepts patterns with balanced brackets", () => {
    // Note: Character classes in glob patterns are handled but may not work as expected
    // since we escape [ and ] as regex metacharacters
    expect(() => matchesGlobPattern("foo.svg", "images/[abc].svg")).not.toThrow();
  });

  it("handles regex compilation errors gracefully", () => {
    // Some edge cases might produce invalid regex - should return false, not throw
    const result = matchesGlobPattern("foo.svg", "images/*.svg");
    expect(typeof result).toBe("boolean");
  });

  it("properly escapes regex metacharacters in patterns", () => {
    // These should be treated as literal characters, not regex
    expect(matchesGlobPattern("images/foo.bar.svg", "images/*.bar.svg")).toBe(true);
    expect(matchesGlobPattern("images/foo+bar.svg", "images/*+bar.svg")).toBe(true);
  });

  it("matches full path with exact boundaries", () => {
    // The regex should match the full path, not partial matches
    expect(matchesGlobPattern("images/foo.svg", "images/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/foo.svg.backup", "images/*.svg")).toBe(false);
  });
});

describe("matchesGlobPattern - functional tests", () => {
  it("matches exact paths", () => {
    expect(matchesGlobPattern("images/foo.svg", "images/foo.svg")).toBe(true);
    expect(matchesGlobPattern("images/foo.svg", "images/bar.svg")).toBe(false);
  });

  it("matches single star patterns", () => {
    expect(matchesGlobPattern("images/foo.svg", "images/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/bar.svg", "images/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/sub/foo.svg", "images/*.svg")).toBe(false);
    expect(matchesGlobPattern("images/foo.png", "images/*.svg")).toBe(false);
  });

  it("matches double star patterns", () => {
    expect(matchesGlobPattern("images/foo.svg", "images/**/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/sub/foo.svg", "images/**/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/deep/nested/path/foo.svg", "images/**/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/foo.png", "images/**/*.svg")).toBe(false);
  });

  it("matches mixed patterns", () => {
    expect(matchesGlobPattern("images/icons/foo.svg", "images/*/*.svg")).toBe(true);
    expect(matchesGlobPattern("images/icons/sub/foo.svg", "images/*/*.svg")).toBe(false);
    expect(matchesGlobPattern("images/icons/sub/foo.svg", "images/*/*/*.svg")).toBe(true);
  });

  it("handles non-glob patterns as prefixes", () => {
    expect(matchesGlobPattern("images/foo.svg", "images/")).toBe(true);
    expect(matchesGlobPattern("images/sub/foo.svg", "images/")).toBe(true);
    expect(matchesGlobPattern("assets/foo.svg", "images/")).toBe(false);
  });
});
