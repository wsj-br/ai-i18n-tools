<a id="runtime-helpers"></a>
# Ayudantes de tiempo de ejecución

Estos asistentes se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno JavaScript (navegador, Node.js, Deno, Edge). **No** importan desde `i18next` o `react-i18next`.

Úselos en el arranque de su aplicación (`src/i18n.js`), el selector de idioma y cualquier código que no sea de React que necesite utilidades de dirección o cadena. Para el cableado de extremo a extremo, comience con [Conectar i18next](/es/guide/ui-strings/i18next-runtime); para menús de idioma y RTL, consulte [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher).

<a id="import-patterns"></a>
## Patrones de importación

La **exportación predeterminada** es solo el espacio de nombres i18next-helper (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importe `interpolateTemplate`, `flipUiArrowsForRtl`, los asistentes de visualización y los tipos como **exportaciones con nombre**, no son propiedades de la exportación predeterminada.

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
## Referencia rápida

| Exportar | Función |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | Opciones estándar de i18next `init()` para configuraciones de clave como predeterminadas. |
| `setupKeyAsDefaultT(i18n, options)` | **Punto de entrada de aplicación recomendado**: contenedor de recorte de clave, paquete plural de origen opcional, `wrapT` con reconocimiento plural. |
| `wrapT(i18n, options)` | Contenedor plural de `t()` de nivel inferior (normalmente instalado por `setupKeyAsDefaultT`). |
| `buildPluralIndexFromStringsJson(entries)` | Construye el mapa `literal → groupId` que `wrapT` usa a partir de filas `strings.json` con `"plural": true`. |
| `extractInterpolationNamesForWrap(message)` | Analiza los nombres de marcadores de posición <code v-pre>{{var}}</code> desde una cadena de origen. |
| `wrapI18nWithKeyTrim(i18n)` | Recorte de clave + fallback de configuración regional de origen <code v-pre>{{var}}</code> solo. **Obsoleto** para cableado de aplicaciones — use `setupKeyAsDefaultT`. |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | Construye el mapa `localeLoaders` para `makeLoadLocale` a partir de `ui-languages.json` (cada `code` excepto `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | Fábrica para la carga asíncrona de JSON de configuración regional a través de `addResourceBundle`. |
| `RTL_LANGS` | Conjunto de solo lectura de códigos de idioma base RTL (reserva cuando falta una configuración regional en el catálogo incluido). |
| `getTextDirection(lng)` | Devuelve `'ltr'` o `'rtl'` para un código BCP-47. |
| `applyDirection(lng, element?)` | Establece el atributo `dir` en `document.documentElement` (navegador) o en un elemento personalizado. |
| `getUILanguageLabel(lang, t)` | Etiqueta del menú de idioma que usa `t(englishName)` cuando se traduce. |
| `getUILanguageLabelNative(lang)` | Etiqueta del menú de idioma solo de los campos del manifiesto (`englishName / label`). |
| `interpolateTemplate(str, vars)` | Sustitución de nivel bajo <code v-pre>{{var}}</code> en una cadena simple (prefiera `t()` en React/i18next). |
| `flipUiArrowsForRtl(text, isRtl)` | Invierte `→` a `←` para diseños de derecha a izquierda (RTL). |

<a id="rtl-helpers"></a>
### Ayudantes RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` consulta primero el catálogo `data/ui-languages-complete.json` incluido (la misma fuente que `generate-ui-languages`), luego recurre a `RTL_LANGS` para los códigos que no están en el catálogo.

`applyDirection` es seguro en Node.js; no hace nada cuando `document` no está disponible. En el navegador, omita `element` para actualizar `document.documentElement`. Conéctelo al cambiar de idioma: `i18n.on('languageChanged', applyDirection)`.

<a id="i18next-setup-factories"></a>
### Fábricas de configuración de i18next

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

Use `setupKeyAsDefaultT` como punto de entrada habitual de la aplicación (eliminación de espacios en claves + plural `wrapT` + `translate-ui` opcional `{sourceLocale}.json`). Llamar solo a `wrapI18nWithKeyTrim` está **obsoleto** para la configuración de aplicaciones.

`sourcePluralFlatBundle` requiere una instancia de i18next con `addResourceBundle()`. El campo `lng` debe coincidir con `SOURCE_LOCALE` en su archivo de arranque y con `sourceLocale` en `ai-i18n-tools.config.json`.

Compile `localeLoaders` con `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para que las claves permanezcan alineadas con `targetLocales` después de `generate-ui-languages`. Consulte [Wire i18next](/es/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) y [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`makeT` personalizado sin i18next).

<a id="display-helpers"></a>
### Ayudantes de visualización

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` se exporta como `{ readonly code: string }`, la forma mínima para las filas del manifiesto en `makeLocaleLoadersFromManifest`. Los asistentes de visualización también necesitan `englishName` (y `label` para `getUILanguageLabelNative`) de las entradas `ui-languages.json` de su proyecto (`{ code, label, englishName, direction }`). Consulte [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher#language-switcher-ui) para ver un ejemplo completo.

<a id="string-helpers"></a>
### Ayudantes de cadenas

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` reemplaza los marcadores de posición <code v-pre>{{name}}</code> donde `name` coincide con `\w+` (solo caracteres de palabra ASCII). Las claves con espacios o guiones no son compatibles. `wrapI18nWithKeyTrim` utiliza esto internamente para el fallback de configuración regional de origen cuando no existe una traducción.

En componentes React/i18next, prefiera <code v-pre>t('clave {{var}}', { var })</code> — i18next maneja la interpolación de forma nativa.

<a id="exported-types"></a>
### Tipos exportados

También se exportan para los consumidores de TypeScript: `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`.
