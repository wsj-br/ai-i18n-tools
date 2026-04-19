export { interpolateTemplate, flipUiArrowsForRtl } from "./template.js";
export {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type TranslateFn,
} from "./ui-language-display.js";
export {
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
} from "./i18next-helpers.js";

import * as i18nextHelpers from "./i18next-helpers.js";

export default i18nextHelpers;
