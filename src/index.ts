export { I18nToolsError, ConfigValidationError, CacheError } from "./core/errors.js";

export {
  type I18nConfig,
  type OpenRouterConfig,
  type FeaturesConfig,
  type GlossaryConfig,
  type UIStringExtractorConfig,
  type ReactExtractorConfig,
  type SvgExtractorConfig,
  type UiConfig,
  type DocumentationBlock,
  type I18nDocTranslateConfig,
  type MarkdownOutputConfig,
  type MarkdownPostProcessingConfig,
  type LanguageListBlockConfig,
  type RegexAdjustmentConfig,
  type SvgAssetsConfig,
  type RawI18nConfigInput,
  type Segment,
  type SegmentType,
  type DocSegmentTranslation,
  type SegmentTranslationMapValue,
  segmentTranslationText,
  translationTextMap,
  type SvgSegmentMeta,
  type TranslationResult,
  type FileTracking,
  type CacheEntry,
  type TranslationRow,
  type CleanupStats,
  type ContentExtractor,
  type GlossaryTerm,
  type BatchTranslationResult,
  type ChatMessage,
  type ChatResponse,
  BatchTranslationError,
  i18nConfigSchema,
} from "./core/types.js";

export {
  type DocArtifactKind,
  resolveDocumentationOutputPath,
  expandPathTemplate,
  shouldRewriteFlatMarkdownLinks,
  toPosix,
} from "./core/output-paths.js";

export {
  type SvgPathTemplateContext,
  expandSvgPathTemplate,
  resolveSvgAssetOutputPath,
  svgAssetCacheFilepath,
  svgTranslationFilepathMetadata,
  relPathUnderSvgSource,
} from "./core/svg-asset-paths.js";

export {
  resolveTranslationModels,
  resolveUITranslationModels,
  coerceTargetLocalesField,
  englishLanguageNameForLocale,
  normalizeLocale,
  parseLocaleList,
  mergeWithDefaults,
  parseI18nConfig,
  applyEnvOverrides,
  loadI18nConfigFromFile,
  defaultI18nConfigPartial,
  validateI18nBusinessRules,
  assertSvgCommandConfig,
  DEFAULT_CONFIG_FILENAME,
  initConfigTemplates,
  writeInitConfigFile,
  toDocTranslateConfig,
} from "./core/config.js";

export { TranslationCache } from "./core/cache.js";

export { USER_EDITED_MODEL } from "./core/user-edited-model.js";

export {
  buildDocumentBatchPrompt,
  buildDocumentSinglePrompt,
  buildUIPromptMessages,
  parseBatchTranslationResponse,
  parseUIJsonArrayResponse,
  UIJsonArrayParseError,
  MARKDOWN_PRESERVATION_RULES,
  JSON_SEGMENT_CONTEXT_ADDENDUM,
  SVG_SEGMENT_CONTEXT_ADDENDUM,
  type DocumentPromptContentType,
} from "./core/prompt-builder.js";

export { computeSegmentHash } from "./utils/hash.js";

export {
  runMapWithConcurrency,
  AsyncSemaphore,
  AsyncMutex,
} from "./utils/concurrency.js";

export {
  Logger,
  type LogLevelName,
  type LoggerOptions,
  truncateLogFile,
  stripAnsi,
} from "./utils/logger.js";

export { loadTranslateIgnore, isIgnored } from "./utils/ignore-parser.js";

export { BaseExtractor } from "./extractors/base-extractor.js";
export { classifySegmentType } from "./extractors/classify-segment.js";
export { MarkdownExtractor, type MarkdownExtractOptions } from "./extractors/markdown-extractor.js";
export { JsonExtractor } from "./extractors/json-extractor.js";
export { SvgExtractor, type SvgExtractorOptions } from "./extractors/svg-extractor.js";
export { UIStringExtractor } from "./extractors/ui-string-extractor.js";
/** @deprecated Use {@link UIStringExtractor} */
export { UIStringExtractor as ReactExtractor } from "./extractors/ui-string-extractor.js";

export { PlaceholderHandler } from "./processors/placeholder-handler.js";
export { protectMarkdownUrls, restoreMarkdownUrls } from "./processors/url-placeholders.js";
export {
  protectAdmonitionSyntax,
  restoreAdmonitionSyntax,
} from "./processors/admonition-placeholders.js";
export { protectDocAnchors, restoreDocAnchors } from "./processors/anchor-placeholders.js";
export { splitTranslatableIntoBatches, type BatchConfig } from "./processors/batch-processor.js";
export {
  validateTranslation,
  validateDocTranslatePair,
  compareMarkdownAST,
  type ValidationResult,
} from "./processors/validator.js";

export { hasInternalPlaceholderLeak } from "./processors/translation-placeholder-leaks.js";

export { OpenRouterClient, type OpenRouterClientOptions } from "./api/openrouter.js";

export { runTranslateUI, type TranslateUIOptions, type TranslateUISummary } from "./cli/translate-ui-strings.js";

export {
  type UiLanguageEntry,
  looksLikeUiLanguagesFileRef,
  expandTargetLocalesFileReferenceInRawInput,
  expandDocumentationTargetLocalesInRawInput,
  getDocumentationTargetLocaleCodes,
  resolveLocalesForDocumentation,
  resolveLocalesForSvg,
  resolveUiLanguagesAbsPath,
  loadUiLanguageEntries,
  mergeUiLanguageDisplayNames,
  resolveUiTranslationTargetCodes,
  resolveLocalesForUI,
  augmentConfigWithUiLanguagesFile,
} from "./core/ui-languages.js";

/**
 * Runtime helpers (no React / i18next import required):
 * - Language row display labels for UI menus
 * - `{{var}}` interpolation for non-i18next contexts
 * - RTL direction detection, DOM `dir` helper
 * - i18next setup factories: init options, key-trim wrapper, locale loader
 */
export {
  interpolateTemplate,
  flipUiArrowsForRtl,
  getUILanguageLabel,
  getUILanguageLabelNative,
  type TranslateFn,
  RTL_LANGS,
  getTextDirection,
  applyDirection,
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  type I18nLike,
  type I18nWithResources,
} from "./runtime/index.js";

export { Glossary } from "./glossary/glossary.js";
export { GlossaryMatcher } from "./glossary/matcher.js";
