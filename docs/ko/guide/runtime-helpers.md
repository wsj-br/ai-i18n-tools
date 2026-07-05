<a id="runtime-helpers"></a>
# 런타임 도우미

이 기능들은 `'ai-i18n-tools/runtime'`에서 내보내지며 모든 JavaScript 환경(브라우저, Node.js, Deno, Edge)에서 작동합니다. `i18next` 또는 `react-i18next`에서 **가져오지 않습니다**.

**기본 내보내기**는 i18next-helper 네임스페이스뿐입니다(`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). `interpolateTemplate`, `flipUiArrowsForRtl` 및 표시 도우미를 **명명된 내보내기**로 가져옵니다. 이들은 기본 내보내기의 속성이 아닙니다.

<a id="rtl-helpers"></a>
### RTL 헬퍼

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 설정 팩토리

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
extractInterpolationNamesForWrap(key: string): string[]
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

일반적인 앱 진입점으로 `setupKeyAsDefaultT`를 사용하세요(키 자르기 + 복수형 `wrapT` + 선택적 `translate-ui` `{sourceLocale}.json`). 애플리케이션 설정을 위해 `wrapI18nWithKeyTrim`만 호출하는 것은 **사용 중단됨**입니다.

`generate-ui-languages` 이후에도 키가 `targetLocales`와 정렬되도록 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`로 `localeLoaders`을(를) 빌드합니다. `docs/guide/ui-strings/i18next-runtime.md`(런타임 연결), `examples/nextjs-app/`, `examples/console-app/` 및 `examples/astro-website/`(i18next 없는 사용자 지정 `makeT`)을(를) 참조하십시오.

<a id="display-helpers"></a>
### 표시 도우미

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow`은(는) `'ai-i18n-tools/runtime'`에서 내보내집니다(형식: `{ code, label, englishName, direction }`). `ui-languages.json`의 매니페스트 행을 입력하는 데 사용합니다.

<a id="string-helpers"></a>
### 문자열 도우미

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate`은(는) `name`가 `\w+`와 일치하는 ```{{name}}``` 자리 표시자를 바꿉니다(ASCII 단어 문자만 해당). 공백이나 하이픈이 있는 키는 지원되지 않습니다.
