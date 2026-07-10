<a id="runtime-helpers"></a>
# Auxiliares de tempo de execução

Estes são exportados de `'ai-i18n-tools/runtime'` e funcionam em qualquer ambiente JavaScript (navegador, Node.js, Deno, Edge). Eles **não** importam de `i18next` ou `react-i18next`.

O **export padrão** é apenas o namespace i18next-helper (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importe `interpolateTemplate`, `flipUiArrowsForRtl` e os auxiliares de exibição como **exports nomeados** — eles não são propriedades do export padrão.

<a id="rtl-helpers"></a>
### Auxiliares de RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### Fábricas de configuração do i18next

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

Use `setupKeyAsDefaultT` como ponto de entrada habitual do aplicativo (chave recortada + plural `wrapT` + opcional `translate-ui` `{sourceLocale}.json`). Chamar apenas `wrapI18nWithKeyTrim` é **obsoleto** para configuração de aplicativos.

Crie `localeLoaders` com `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para que as chaves permaneçam alinhadas com `targetLocales` após `generate-ui-languages`. Consulte [Runtime wiring](/pt-BR/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) e [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`makeT` personalizado sem i18next).

<a id="display-helpers"></a>
### Auxiliares de exibição

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` é exportado de `'ai-i18n-tools/runtime'` (formato: `{ code, label, englishName, direction }`). Use-o para tipar linhas de manifesto de `ui-languages.json`.

<a id="string-helpers"></a>
### Auxiliares de string

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` substitui os espaços reservados de ```{{name}}``` onde `name` corresponde a `\w+` (apenas caracteres de palavra ASCII). Chaves com espaços ou hífens não são suportadas.
