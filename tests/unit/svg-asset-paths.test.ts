import path from "path";
import { mergeWithDefaults, parseI18nConfig } from "../../src/core/config";
import {
  expandSvgPathTemplate,
  relPathUnderSvgSource,
  resolveSvgAssetOutputPath,
  svgAssetCacheFilepath,
} from "../../src/core/svg-asset-paths";

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
      documentation: { contentPaths: [], outputDir: "./i18n", cacheDir: ".cache" },
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
      documentation: { contentPaths: [], outputDir: "./i18n", cacheDir: ".cache" },
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
      documentation: { contentPaths: [], outputDir: "./i18n", cacheDir: ".cache" },
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
    expect(abs).toBe(
      path.join(cwd, "public/assets/illustrations/translation_demo_svg__de.svg")
    );
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

  it("svgAssetCacheFilepath prefixes svg-assets/", () => {
    expect(svgAssetCacheFilepath("images/x.svg")).toBe("svg-assets/images/x.svg");
  });

  it("relPathUnderSvgSource picks longest matching root", () => {
    expect(relPathUnderSvgSource("images/a.svg", ["images"])).toBe("a.svg");
    expect(relPathUnderSvgSource("images/sub/a.svg", ["images"])).toBe("sub/a.svg");
  });
});
