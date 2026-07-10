<a id="runtime-helpers"></a>
# Ayudantes de tiempo de ejecución

Estas se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno JavaScript (navegador, Node.js, Deno, Edge). No **importan** desde `i18next` ni `react-i18next`.

La **exportación predeterminada** es solo el espacio de nombres i18next-helper (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importe `interpolateTemplate`, `flipUiArrowsForRtl` y los ayudantes de visualización como **exportaciones con nombre**; no son propiedades de la exportación predeterminada.

<a id="rtl-helpers"></a>
### Ayudantes RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### Fábricas de configuración de i18next

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

Use `setupKeyAsDefaultT` como punto de entrada habitual de la aplicación (eliminación de espacios en claves + plural `wrapT` + `translate-ui` opcional `{sourceLocale}.json`). Llamar solo a `wrapI18nWithKeyTrim` está **obsoleto** para la configuración de aplicaciones.

Cree `localeLoaders` con `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para que las claves permanezcan alineadas con `targetLocales` después de `generate-ui-languages`. Consulte [Cableado en tiempo de ejecución](/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) y [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`makeT` personalizado sin i18next).

<a id="display-helpers"></a>
### Ayudantes de visualización

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` se exporta desde `'ai-i18n-tools/runtime'` (forma: `{ code, label, englishName, direction }`). Úselo para escribir filas de manifiesto desde `ui-languages.json`.

<a id="string-helpers"></a>
### Ayudantes de cadenas

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` reemplaza los marcadores de posición ```{{name}}``` donde `name` coincide con `\w+` (solo caracteres de palabras ASCII). Las claves con espacios o guiones no son compatibles.
