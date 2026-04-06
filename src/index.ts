export { I18nToolsError, ConfigValidationError, CacheError } from "./core/errors.js";

export {
  type I18nConfig,
  type OpenRouterConfig,
  type FeaturesConfig,
  type GlossaryConfig,
  type ReactExtractorConfig,
  type SvgExtractorConfig,
  type UiConfig,
  type DocumentationConfig,
  type MarkdownOutputConfig,
  type RawI18nConfigInput,
  type Segment,
  type SegmentType,
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
  resolveTranslationModels,
  coerceTargetLocalesField,
  normalizeLocale,
  parseLocaleList,
  mergeWithDefaults,
  parseI18nConfig,
  applyEnvOverrides,
  loadI18nConfigFromFile,
  defaultI18nConfigPartial,
  validateI18nBusinessRules,
  DEFAULT_CONFIG_FILENAME,
  initConfigTemplates,
  writeInitConfigFile,
} from "./core/config.js";

export { TranslationCache } from "./core/cache.js";

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
  Logger,
  type LogLevelName,
  type LoggerOptions,
  truncateLogFile,
  stripAnsi,
} from "./utils/logger.js";

export { loadTranslateIgnore, isIgnored } from "./utils/ignore-parser.js";

export { BaseExtractor } from "./extractors/base-extractor.js";
export { classifySegmentType } from "./extractors/classify-segment.js";
export { MarkdownExtractor } from "./extractors/markdown-extractor.js";
export { JsonExtractor } from "./extractors/json-extractor.js";
export { SvgExtractor, type SvgExtractorOptions } from "./extractors/svg-extractor.js";
export { ReactExtractor } from "./extractors/react-extractor.js";

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
  segmentMarkdownUrlCountsMatch,
  type ValidationResult,
} from "./processors/validator.js";

export { OpenRouterClient, type OpenRouterClientOptions } from "./api/openrouter.js";

export { runTranslateUI, type TranslateUIOptions, type TranslateUISummary } from "./cli/translate-ui-strings.js";

export {
  type UiLanguageEntry,
  looksLikeUiLanguagesFileRef,
  expandTargetLocalesFileReferenceInRawInput,
  expandDocumentationTargetLocalesInRawInput,
  getDocumentationTargetLocaleCodes,
  resolveLocalesForDocumentation,
  resolveUiLanguagesAbsPath,
  loadUiLanguageEntries,
  mergeUiLanguageDisplayNames,
  resolveUiTranslationTargetCodes,
  resolveLocalesForUI,
  augmentConfigWithUiLanguagesFile,
} from "./core/ui-languages.js";

/**
 * Optional runtime helpers (no React / i18next dependency): language row labels, `{{var}}` interpolation,
 * RTL arrow flip — same ideas as Transrewrt `languageDisplay.js` / `formatUtils.js`.
 */
export {
  interpolateTemplate,
  flipUiArrowsForRtl,
  getUILanguageLabel,
  getUILanguageLabelNative,
  type TranslateFn,
} from "./runtime/index.js";

export { Glossary } from "./glossary/glossary.js";
export { GlossaryMatcher } from "./glossary/matcher.js";
