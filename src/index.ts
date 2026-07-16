export { I18nToolsError, ConfigValidationError, CacheError } from "./core/errors.js";

export {
  type I18nConfig,
  type LlmProviderConfig,
  type ProvidersConfig,
  type OpenRouterConfig,
  type FeaturesConfig,
  type GlossaryConfig,
  type UIStringExtractorConfig,
  type ReactExtractorConfig,
  type SvgExtractorConfig,
  type UiConfig,
  type DocBlock,
  type I18nDocTranslateConfig,
  type MarkdownOutputConfig,
  type SegmentSplittingConfig,
  segmentSplittingSchema,
  mergeSegmentSplittingOpts,
  type MarkdownPostProcessingConfig,
  type LanguageListBlockConfig,
  type RegexAdjustmentConfig,
  type SvgFilesConfig,
  type RawI18nConfigInput,
  type CldrPluralForm,
  type StringsJsonEntry,
  type StringsJsonPluralEntry,
  type StringsJsonPlainEntry,
  isPluralStringsEntry,
  type Segment,
  type SegmentType,
  type DocSegmentTranslation,
  type SegmentTranslationMapValue,
  segmentTranslationText,
  translationTextMap,
  type SvgSegmentMeta,
  type ImageSegmentMeta,
  type TranslationResult,
  type FileTracking,
  type CacheEntry,
  type TranslationRow,
  type MarkdownSourceIssueInsert,
  type MarkdownSourceIssueListRow,
  type MarkdownSourceIssueSummary,
  type CleanupStats,
  type ContentExtractor,
  type GlossaryTerm,
  type BatchTranslationResult,
  type ChatMessage,
  type ChatResponse,
  type LlmUsageStats,
  type OpenRouterUsageStats,
  BatchTranslationError,
  i18nConfigSchema,
} from "./core/types.js";

export {
  type DocArtifactKind,
  resolveDocumentationOutputPath,
  expandPathTemplate,
  shouldRewriteFlatMarkdownLinks,
  shouldRewriteFumadocsLinks,
  shouldRewriteNextraLinks,
  shouldRewriteVitepressLinks,
  fumadocsLinkNormalizeContext,
  nextraLinkNormalizeContext,
  vitepressLinkNormalizeContext,
  toPosix,
} from "./core/output-paths.js";

export {
  type SvgPathTemplateContext,
  expandSvgPathTemplate,
  resolveSvgAssetOutputPath,
  svgAssetCacheFilepath,
  svgTranslationFilepathMetadata,
  relPathUnderSvgSource,
  matchesGlobPattern,
  GlobPatternError,
} from "./core/svg-asset-paths.js";

export {
  resolveTranslationModels,
  resolveTranslationModelsForLocale,
  resolveUITranslationModels,
  resolveAllConfiguredModelIds,
  dedupeOrderedModelIds,
  coerceTargetLocalesField,
  disallowedScriptLetters,
  englishLanguageNameForLocale,
  englishScriptName,
  hanVariantCounts,
  isLatinScriptLocale,
  nonLatinLettersIn,
  scriptLetterCounts,
  effectiveScriptSubtag,
  scriptSubtag,
  scriptValidationIssue,
  unicodeScriptPropertyForSubtag,
  normalizeLocale,
  localePathPlaceholders,
  parseLocaleList,
  mergeWithDefaults,
  parseI18nConfig,
  applyEnvOverrides,
  augmentConfigWithUiLanguagesMaster,
  applyDefaultLanguagesManifestPathToRawInput,
  /** @deprecated Use {@link applyDefaultLanguagesManifestPathToRawInput} */
  applyDefaultUiLanguagesPathToRawInput,
  loadI18nConfigFromFile,
  defaultI18nConfigPartial,
  validateI18nBusinessRules,
  assertSvgCommandConfig,
  DEFAULT_CONFIG_FILENAME,
  initConfigTemplates,
  writeInitConfigFile,
  DEFAULT_INIT_PROVIDER_KEY,
  DEFAULT_INIT_MODELS_BY_PROVIDER,
  defaultInitModelsForProvider,
  buildInitProviderBlock,
  applyInitProvider,
  assertPresetInitProvider,
  listPresetInitProviderKeys,
  toDocTranslateConfig,
} from "./core/config.js";

export { TranslationCache } from "./core/cache.js";

export { USER_EDITED_MODEL } from "./core/user-edited-model.js";

export {
  buildDocumentBatchPrompt,
  buildDocumentSinglePrompt,
  buildUIPromptMessages,
  buildPluralStep0Prompt,
  buildPluralPassBPrompt,
  parseBatchTranslationResponse,
  parsePluralFormsJsonResponse,
  parseUIJsonArrayResponse,
  PromptParseError,
  PluralFormsParseError,
  UIJsonArrayParseError,
  ScriptValidationError,
  targetScriptDirective,
  PROMPTS,
  MARKDOWN_PRESERVATION_RULES,
  JSON_SEGMENT_CONTEXT_ADDENDUM,
  SVG_SEGMENT_CONTEXT_ADDENDUM,
  type DocumentPromptContentType,
  type PromptStrings,
  type DocumentPromptStrings,
  type UIPromptStrings,
} from "./core/prompt-builder.js";

export { computeSegmentHash } from "./utils/hash.js";

export { runMapWithConcurrency, AsyncSemaphore, AsyncMutex } from "./utils/concurrency.js";

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
export {
  HTML_I18N_MARKERS,
  HTML_I18N_IGNORE_ATTR,
  normalizeI18nText,
  decodeBasicHtmlEntities,
  collectHtmlI18nStrings,
  collectHtmlI18nLocations,
  markHtmlContent,
  type HtmlI18nString,
  type MarkHtmlResult,
  type MarkHtmlSkipped,
} from "./extractors/html-i18n-marks.js";

export { PlaceholderHandler } from "./processors/placeholder-handler.js";
export {
  protectBoldWrappedInlineCode,
  restoreBoldWrappedInlineCode,
} from "./processors/bold-code-placeholders.js";
export {
  protectInlineCodeSpans,
  restoreInlineCodeSpans,
} from "./processors/inline-code-placeholders.js";
export { protectMarkdownUrls, restoreMarkdownUrls } from "./processors/url-placeholders.js";
export {
  protectAdmonitionSyntax,
  restoreAdmonitionSyntax,
} from "./processors/admonition-placeholders.js";
export { protectDocAnchors, restoreDocAnchors } from "./processors/anchor-placeholders.js";
export { protectMdx, restoreMdx } from "./processors/mdx-placeholders.js";
export { splitTranslatableIntoBatches, type BatchConfig } from "./processors/batch-processor.js";
export {
  validateTranslation,
  validateDocTranslatePair,
  compareMarkdownAST,
  type ValidationResult,
} from "./processors/validator.js";

export {
  collectMarkdownSourceIssues,
  collectMarkdownIssuesForSegment,
  shouldDiagnoseMarkdownSegment,
  MARKDOWN_SOURCE_ISSUE_CODES,
  type MarkdownSourceIssue,
  type MarkdownSourceIssueCode,
} from "./processors/markdown-source-diagnostics.js";

export { hasInternalPlaceholderLeak } from "./processors/translation-placeholder-leaks.js";
export {
  protectGlossaryForcedTerms,
  restoreGlossaryForcedTerms,
  glossaryForcePlaceholderToken,
} from "./processors/glossary-force-placeholders.js";

export {
  normalizeVitepressDocLinks,
  normalizeVitepressFrontmatterLinks,
  normalizeOneVitepressLink,
  applyVitepressLocaleRoutePrefix,
  prefixVitepressThemeNavLinks,
  prefixVitepressThemeConfigLinks,
  docsPathToVitepressRoute,
  type VitepressLinkNormalizeContext,
  type VitepressThemeNavItem,
} from "./processors/vitepress-link-normalize.js";

export {
  normalizeNextraDocLinks,
  normalizeOneNextraLink,
  docsPathToNextraRoute,
  type NextraLinkNormalizeContext,
} from "./processors/nextra-link-normalize.js";

export {
  normalizeFumadocsDocLinks,
  normalizeOneFumadocsLink,
  docsPathToFumadocsRoute,
  type FumadocsLinkNormalizeContext,
} from "./processors/fumadocs-link-normalize.js";

export {
  filterFumadocsDotMarkdownSources,
  isFumadocsDotLocaleSuffixedSource,
  fumadocsDotLocaleSuffixes,
} from "./core/fumadocs-dot-source-filter.js";

export {
  fumadocsParserMode,
  isFumadocsPreset,
  isFumadocsDotParser,
  isFumadocsDirParser,
  type FumadocsParserMode,
} from "./core/fumadocs-parser.js";

export {
  OpenRouterClient,
  type LlmClientOptions,
  type OpenRouterClientOptions,
} from "./api/llm-client.js";

export {
  PROVIDER_PRESETS,
  OPENROUTER_PROVIDER_KEY,
  DEFAULT_LLM_MAX_TOKENS,
  DEFAULT_LLM_TEMPERATURE,
  DEFAULT_LLM_REQUEST_TIMEOUT_MS,
  isPresetProvider,
  resolveActiveProvider,
  resolveProviderSettings,
  resolveApiKey,
  translationModelsForProvider,
  uiModelsForProvider,
  localeModelsForProvider,
  localeModelsMapForProvider,
  allConfiguredModelIdsForProvider,
  type LlmProviderPreset,
  type ResolvedProviderSettings,
} from "./core/llm-providers.js";

export {
  runTranslateUI,
  type TranslateUIOptions,
  type TranslateUISummary,
} from "./cli/translate-ui-strings.js";

export {
  type UiLanguageEntry,
  assertTargetLocalesAreLocaleCodes,
  looksLikeUiLanguagesFileRef,
  expandTargetLocalesFileReferenceInRawInput,
  expandDocumentationTargetLocalesInRawInput,
  getConfiguredCacheLocales,
  getDocumentationTargetLocaleCodes,
  resolveLocalesForDocumentation,
  resolveLocalesForSvg,
  resolveLanguagesManifestAbsPath,
  /** @deprecated Use {@link resolveLanguagesManifestAbsPath} */
  resolveUiLanguagesAbsPath,
  loadUiLanguageEntries,
  mergeUiLanguageDisplayNames,
  resolveUiTranslationTargetCodes,
  resolveLocalesForUI,
} from "./core/ui-languages.js";

export {
  buildUiLanguageRowsFromMaster,
  effectiveUiLanguagesCodes,
  loadUiLanguagesMaster,
  resolveBundledUiLanguagesCompletePath,
  type UiLanguageRow,
} from "./core/ui-languages-catalog.js";

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
  setupKeyAsDefaultT,
  wrapT,
  buildPluralIndexFromStringsJson,
  extractInterpolationNamesForWrap,
  makeLocaleLoadersFromManifest,
  makeLoadLocale,
  type I18nLike,
  type I18nWithResources,
  type SetupKeyAsDefaultTOptions,
  type UiLanguageManifestRow,
  type WrapTOptions,
} from "./runtime/index.js";

export {
  requiredCldrPluralForms,
  compactIdenticalPluralForms,
  expandPluralFormsForFlatOutput,
  pluralCategoryExamplesHint,
  formsCompleteForLocale,
  pluralFormsRequiredForTranslateUi,
  pluralTranslatedLocaleHasContent,
} from "./core/plural-forms.js";

export { Glossary } from "./glossary/glossary.js";
export { GlossaryMatcher } from "./glossary/matcher.js";
