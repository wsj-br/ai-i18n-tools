<a id="runtime-helpers"></a>
# 런타임 도우미

이 헬퍼들은 `'ai-i18n-tools/runtime'`에서 내보내지며 모든 JavaScript 환경(브라우저, Node.js, Deno, Edge)에서 작동합니다. 이들은 `i18next` 또는 `react-i18next`에서 가져오지 **않습니다**.

앱 부트스트랩(`src/i18n.js`), 언어 전환기, 방향이나 문자열 유틸리티가 필요한 모든 비-React 코드에서 이를 사용하세요. 엔드투엔드 연결을 위해 [i18next 연결](/ko/guide/ui-strings/i18next-runtime)로 시작하세요. 언어 메뉴 및 RTL의 경우 [언어 전환기 및 RTL](/ko/guide/ui-strings/language-switcher)을 참조하세요.

<a id="import-patterns"></a>
## 가져오기 패턴

**기본 내보내기**는 i18next-helper 네임스페이스만 포함합니다(`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). `interpolateTemplate`, `flipUiArrowsForRtl`, 디스플레이 헬퍼 및 타입은 **명명된 내보내기**로 가져오세요. 이들은 기본 내보내기의 속성이 아닙니다.

```js
// Namespace style (common in i18n bootstrap files)
import aiI18n from 'ai-i18n-tools/runtime';
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

// Named imports (language switcher, one-off utilities)
import {
  getUILanguageLabel,
  getTextDirection,
  type UiLanguageManifestRow,
} from 'ai-i18n-tools/runtime';
```

<a id="quick-reference"></a>
## 빠른 참조

| 내보내기 | 역할 |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | 키를 기본값으로 사용하는 설정을 위한 표준 i18next `init()` 옵션입니다. |
| `setupKeyAsDefaultT(i18n, options)` | **권장 앱 진입점** — 키 트림 래퍼, 선택적 소스 복수형 번들, 복수형 인식 `wrapT`. |
| `wrapT(i18n, options)` | 하위 수준 복수형 `t()` 래퍼(일반적으로 `setupKeyAsDefaultT`에 의해 설치됨). |
| `buildPluralIndexFromStringsJson(entries)` | `"plural": true`를 사용하여 `strings.json` 행에서 `wrapT`가 사용하는 `literal → groupId` 맵을 빌드합니다. |
| `extractInterpolationNamesForWrap(message)` | 소스 문자열에서 <code v-pre>{{var}}</code> 플레이스홀더 이름을 구문 분석합니다. |
| `wrapI18nWithKeyTrim(i18n)` | 키 트림 + 소스 로캘 <code v-pre>{{var}}</code> 폴백만 사용합니다. **사용되지 않음** 앱 와이어링에 대해 — `setupKeyAsDefaultT`을(를) 사용하세요. |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | `ui-languages.json`에서 `makeLoadLocale`를 위한 `localeLoaders` 맵을 빌드합니다(`sourceLocale`를 제외한 모든 `code`). |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | `addResourceBundle`를 통한 비동기 로케일 JSON 로딩을 위한 팩토리입니다. |
| `RTL_LANGS` | RTL 기본 언어 코드의 읽기 전용 세트(번들된 카탈로그에 로케일이 없을 때 폴백). |
| `getTextDirection(lng)` | BCP-47 코드에 대해 `'ltr'` 또는 `'rtl'`를 반환합니다. |
| `applyDirection(lng, element?)` | `document.documentElement`(브라우저) 또는 사용자 정의 요소에 `dir` 속성을 설정합니다. |
| `getUILanguageLabel(lang, t)` | 번역 시 `t(englishName)`를 사용하는 언어 메뉴 레이블입니다. |
| `getUILanguageLabelNative(lang)` | 매니페스트 필드만 사용하는 언어 메뉴 레이블입니다(`englishName / label`). |
| `interpolateTemplate(str, vars)` | 일반 문자열에서 <code v-pre>{{var}}</code> 치환의 저수준 (React/i18next에서 `t()`을(를) 선호합니다). |
| `flipUiArrowsForRtl(text, isRtl)` | RTL 레이아웃을 위해 `→`을 `←`로 전환합니다. |

<a id="rtl-helpers"></a>
### RTL 헬퍼

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection`는 번들된 `data/ui-languages-complete.json` 카탈로그를 먼저 참조하고(`generate-ui-languages`와 동일한 소스), 카탈로그에 없는 코드는 `RTL_LANGS`로 폴백합니다.

`applyDirection`는 Node.js에서 안전합니다 — `document`를 사용할 수 없을 때 아무 작업도 수행하지 않습니다. 브라우저에서 `document.documentElement`를 업데이트하려면 `element`를 생략하세요. 언어 변경 시 연결하세요: `i18n.on('languageChanged', applyDirection)`.

<a id="i18next-setup-factories"></a>
### i18next 설정 팩토리

```ts
defaultI18nInitOptions(sourceLocale?: string): {
  resources: Record<string, never>;
  lng: string;
  fallbackLng: string;
  parseMissingKeyHandler: (key: string) => string;
  interpolation: { escapeValue: false };
  nsSeparator: false;
}

setupKeyAsDefaultT(
  i18n: I18nLike & Partial<Pick<I18nWithResources, 'addResourceBundle'>>,
  options: SetupKeyAsDefaultTOptions
): void

// SetupKeyAsDefaultTOptions:
// {
//   stringsJson: Record<string, { plural?: boolean; source?: string }>;
//   sourcePluralFlatBundle?: { lng: string; bundle: Record<string, string> };
// }

wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
// WrapTOptions: { pluralIndex: Record<string, string> }

buildPluralIndexFromStringsJson(
  entries: Record<string, { plural?: boolean; source?: string }>
): Record<string, string>

extractInterpolationNamesForWrap(message: string): string[]

makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>

makeLoadLocale(
  i18n: I18nLike & Pick<I18nWithResources, 'addResourceBundle'>,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

일반적인 앱 진입점으로 `setupKeyAsDefaultT`를 사용하세요(키 자르기 + 복수형 `wrapT` + 선택적 `translate-ui` `{sourceLocale}.json`). 애플리케이션 설정을 위해 `wrapI18nWithKeyTrim`만 호출하는 것은 **사용 중단됨**입니다.

`sourcePluralFlatBundle`에는 `addResourceBundle()`이(가) 포함된 i18next 인스턴스가 필요합니다. `lng` 필드는 부트스트랩 파일의 `SOURCE_LOCALE`과(와) `ai-i18n-tools.config.json`의 `sourceLocale`과(와) 일치해야 합니다.

`generate-ui-languages` 후 키가 `targetLocales`과(와) 정렬된 상태를 유지하려면 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`(으)로 `localeLoaders`을(를) 빌드하세요. [Wire i18next](/ko/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/), [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (i18next 없는 사용자 정의 `makeT`)를 참고하세요.

<a id="display-helpers"></a>
### 표시 도우미

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow`은(는) `makeLocaleLoadersFromManifest`의 매니페스트 행에 필요한 최소한의 형태인 `{ readonly code: string }`(으)로 내보내집니다. 표시 헬퍼는 프로젝트의 `ui-languages.json` 항목 (`{ code, label, englishName, direction }`)에서 `englishName`(과(와)) (`getUILanguageLabelNative`용 `label`)도 필요합니다. 전체 예제는 [Language switcher & RTL](/ko/guide/ui-strings/language-switcher#language-switcher-ui)을(를) 참고하세요.

<a id="string-helpers"></a>
### 문자열 도우미

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate`은 <code v-pre>{{name}}</code> 플레이스홀더를 대체합니다. 여기서 `name`이 `\w+`(ASCII 단어 문자만 해당)에 일치합니다. 공백이나 하이픈이 포함된 키는 지원되지 않습니다. `wrapI18nWithKeyTrim`은 번역이 존재하지 않는 경우 소스 로캘 폴백에 내부적으로 이를 사용합니다.

React/i18next 구성 요소에서 <code v-pre>t('키 {{var}}', { var })</code>을(를) 선호합니다 — i18next는 보간을 기본적으로 처리합니다.

<a id="exported-types"></a>
### 내보내진 타입

TypeScript 사용자를 위한 추가 내보내기: `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`.
