import type { UiConfig, UIStringExtractorConfig } from "./types.js";

/**
 * Resolved UI extractor settings (`ui.uiExtractor` preferred, `ui.reactExtractor` legacy alias).
 */
export function getUiExtractorConfig(ui: UiConfig): Partial<UIStringExtractorConfig> | undefined {
  return ui.uiExtractor ?? ui.reactExtractor;
}
