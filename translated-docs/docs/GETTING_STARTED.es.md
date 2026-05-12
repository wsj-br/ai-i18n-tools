<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Introducción

`ai-i18n-tools` proporciona dos flujos de trabajo independientes y componibles:

- **Flujo de trabajo 1 - Traducción de interfaz**: extraer llamadas `t("…")` de cualquier fuente JS/TS, traducirlas mediante OpenRouter y generar archivos JSON planos por idioma listos para i18next.
- **Flujo de trabajo 2 - Traducción de documentos**: traducir **páginas markdown y MDX** listadas en `contentPaths` a cualquier número de idiomas, con caché inteligente — es decir, la documentación localizada que los lectores abren en el sitio. Opcionalmente, los archivos **JSON de Docusaurus** (`jsonSource`, de `docusaurus write-translations`) cubren elementos de **interfaz del sitio** (barra de navegación, pie de página, cadenas de UI de temas/plugins), no el contenido textual en `docs/`. Los archivos **SVG** usan `features.translateSVG`, el bloque superior `svg` y `translate-svg` (ver [referencia CLI](#cli-reference)).

Ambos flujos de trabajo utilizan OpenRouter (cualquier LLM compatible) y comparten un único archivo de configuración.

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenido**

- [Instalación](#installation)
- [Inicio rápido](#quick-start)
  - [Scripts recomendados `package.json`](#recommended-packagejson-scripts)
- [Flujo de trabajo 1 - Traducción de interfaz](#workflow-1---ui-translation)
  - [Paso 1: Inicializar](#step-1-initialise)
  - [Paso 2: Extraer cadenas](#step-2-extract-strings)
  - [Paso 3: Traducir cadenas de interfaz](#step-3-translate-ui-strings)
  - [Exportar a XLIFF 2.0 (opcional)](#exporting-to-xliff-20-optional)
  - [Paso 4: Conectar i18next en tiempo de ejecución](#step-4-wire-i18next-at-runtime)
  - [Usar `t()` en el código fuente](#using-t-in-source-code)
  - [Interpolación](#interpolation)
  - [Plurales cardinales (`plurals: true`)](#cardinal-plurals-plurals-true)
  - [Interfaz de selector de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Flujo de trabajo 2 - Traducción de documentos](#workflow-2---document-translation)
  - [Paso 1: Inicializar para documentación](#step-1-initialise-for-documentation)
  - [Paso 2: Traducir documentos](#step-2-translate-documents)
    - [Markdown complejo y comprobaciones de calidad fallidas](#complex-markdown-and-failed-quality-checks)
    - [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags)
    - [Formato de lote de indicaciones](#batch-prompt-format)
    - [Dedupe de segmentos y rutas en SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Diseños de salida](#output-layouts)
    - [Enlaces de anclaje en diseño plano](#anchor-links-in-flat-layout)
    - [Imágenes y recursos raster en documentos traducidos](#images-and-raster-assets-in-translated-docs)
    - [Marcadores de posición `pathTemplate` / `jsonPathTemplate`](#pathtemplate--jsonpathtemplate-placeholders)
- [Flujo de trabajo combinado (UI + Docs)](#combined-workflow-ui--docs)
  - [Flujo de trabajo mixto de documentación (Docusaurus + plano)](#mixed-documentation-workflow-docusaurus--flat)
- [Editor de caché de traducción](#translation-cache-editor)
  - [Errores (traducción de documentos)](#failures-document-translation)
    - [Cuándo usarlo](#when-to-use-it)
    - [Por qué son importantes las ediciones en el origen](#why-source-edits-matter)
    - [Cómo usar la pestaña](#how-to-use-the-tab)
  - [Problemas de Markdown (comprobaciones estáticas)](#markdown-issues-static-checks)
- [Referencia de configuración](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (opcional)](#uilanguagespath-optional)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`fileConcurrency` (opcional)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Mejor práctica para exclusiones en git:](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [Referencia de la CLI](#cli-reference)
- [Variables de entorno](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Instalación

El paquete publicado es **solo ESM**. Usa `import`/`import()` en Node.js o en tu empaquetador; no uses `require('ai-i18n-tools')`. El paquete declara `engines.node` `>=22.16.0`; no se admiten versiones antiguas de Node.js.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools incluye su propio extractor de cadenas. Si anteriormente usabas `i18next-scanner`, `babel-plugin-i18next-extract` o herramientas similares, puedes eliminar esas dependencias de desarrollo tras migrar.

Establece tu clave de API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O crea un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Inicio rápido

La plantilla predeterminada `init` (`ui-markdown`) habilita únicamente la extracción y traducción de la **interfaz de usuario**. La plantilla `ui-docusaurus` habilita la traducción de **documentos** (`translate-docs`). Utilice `sync` cuando desee un único comando que ejecute la extracción, la traducción de la interfaz de usuario, la traducción opcional de archivos SVG y la traducción de documentación según su configuración.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados `package.json`

Con el paquete instalado localmente, puedes usar los comandos CLI directamente en scripts (no se necesita `npx`).

**Prefiere** `sync` para cualquier cosa que antes era "ejecuta `translate-ui`, luego `translate-svg`, luego `translate-docs`": `ai-i18n-tools sync` ejecuta **extract** (cuando está habilitado), **translate-ui**, opcionalmente **translate-svg** y luego **translate-docs** — en el orden correcto y con banderas compartidas — de acuerdo con tu configuración. Encadenar manualmente esos tres comandos de traducción es fácil de hacer mal (orden, extracción, banderas de configuración regional). Usa `i18n:translate:ui`, `i18n:translate:svg` y `i18n:translate:docs` solo cuando necesites un **único** paso de forma aislada.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## Flujo de trabajo 1 - Traducción de interfaz

Diseñado para cualquier proyecto JS/TS que use i18next: aplicaciones React, Next.js (componentes cliente y servidor), servicios Node.js, herramientas CLI.

<a id="step-1-initialise"></a>
### Paso 1: Inicializar

```bash
npx ai-i18n-tools init
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown`. Edítalo para configurar:

- `sourceLocale` - código BCP-47 de tu idioma fuente (por ejemplo, `"en-GB"`). **Debe coincidir** con `SOURCE_LOCALE` exportado desde tu archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - matriz de códigos BCP-47 para tus idiomas de destino (por ejemplo, `["de", "fr", "pt-BR"]`). Ejecuta `generate-ui-languages` para crear el manifiesto `ui-languages.json` a partir de esta lista.
- `ui.sourceRoots` - directorios o patrones glob para escanear llamadas a `t("…")` (por ejemplo, `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - ubicación donde escribir el catálogo maestro (por ejemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - dónde escribir `de.json`, `pt-BR.json`, etc. (por ejemplo, `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID del modelo OpenRouter a intentar **primero** solo para `translate-ui`; si falla, la CLI continúa con `openrouter.translationModels` (o `defaultModel` / `fallbackModel` heredados) en orden, omitiendo duplicados.

<a id="step-2-extract-strings"></a>
### Paso 2: Extraer cadenas

```bash
npx ai-i18n-tools extract
```

Analiza todos los archivos JS/TS dentro de `ui.sourceRoots` en busca de llamadas a `t("literal")` y `i18n.t("literal")`. Escribe (o combina en) `ui.stringsJson`.

El escáner es configurable: añade nombres personalizados de funciones mediante `ui.reactExtractor.funcNames`.

<a id="step-3-translate-ui-strings"></a>
### Paso 3: Traducir cadenas de interfaz

```bash
npx ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes a OpenRouter para cada configuración regional de destino y escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. Cuando se establece `ui.preferredModel`, primero se intenta ese modelo antes que la lista ordenada en `openrouter.translationModels` (los comandos de traducción de documentos y otros siguen usando únicamente `openrouter`).

Para cada entrada, `translate-ui` almacena el **ID del modelo de OpenRouter** que tradujo correctamente cada configuración regional en un objeto opcional `models` (con las mismas claves de configuración regional que en `translated`). Las cadenas editadas mediante el comando local `editor` se marcan con el valor centinela `user-edited` en `models` para esa configuración regional. Los archivos planos por configuración regional bajo `ui.flatOutputDir` siguen siendo solo **cadena fuente → traducción**; no incluyen `models` (por lo que los paquetes en tiempo de ejecución permanecen sin cambios).

> **Nota sobre el uso del editor de caché:** Si editas una entrada en el editor de caché, debes ejecutar un `sync --force-update` (o el comando equivalente `translate` con `--force-update`) para volver a escribir los archivos de salida con la entrada de caché actualizada. Ten en cuenta también que si el texto fuente cambia más adelante, tu edición manual se perderá porque se generará una nueva clave de caché (hash) para la nueva cadena fuente.

<a id="exporting-to-xliff-20-optional"></a>
### Exportar a XLIFF 2.0 (opcional)

Para entregar las cadenas de la interfaz a un proveedor de traducción, un sistema de gestión de traducción (TMS) o una herramienta CAT, exporta el catálogo como **XLIFF 2.0** (un archivo por configuración regional de destino). Este comando es **de solo lectura**: no modifica `strings.json` ni llama a ninguna API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Por defecto, los archivos se escriben junto a `ui.stringsJson`, con nombres como `strings.de.xliff`, `strings.pt-BR.xliff` (nombre base de tu catálogo + configuración regional + `.xliff`). Usa `-o` / `--output-dir` para escribir en otra ubicación. Las traducciones existentes de `strings.json` aparecen en `<target>`; las configuraciones regionales faltantes usan `state="initial"` sin `<target>` para que las herramientas puedan completarlas. Usa `--untranslated-only` para exportar solo las unidades que aún necesitan traducción para cada configuración regional (útil para lotes enviados a proveedores). `--dry-run` muestra las rutas sin escribir archivos.

<a id="step-4-wire-i18next-at-runtime"></a>
### Paso 4: Integrar i18next en tiempo de ejecución

Crea tu archivo de configuración i18n usando los ayudantes exportados por `'ai-i18n-tools/runtime'`:

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**Mantenga alineados tres valores:** `sourceLocale` en `ai-i18n-tools.config.json`, `SOURCE_LOCALE` en este archivo, y el JSON plano plural que `translate-ui` escribe como `{sourceLocale}.json` en su directorio de salida plano (habitualmente `public/locales/`). Use el mismo nombre base en el `import` estático (ejemplo anterior: `en-GB` → `en-GB.json`). El campo `lng` en `sourcePluralFlatBundle` debe ser igual a `SOURCE_LOCALE`. Las rutas de ES estáticas `import` no pueden usar variables; si cambia el idioma fuente, actualice `SOURCE_LOCALE` y la ruta de importación conjuntamente. Alternativamente, cargue ese archivo con un `import(\` dinámico ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, o `readFileSync` para que la ruta se construya a partir de `SOURCE_LOCALE`.

El fragmento usa `./locales/…` y `./public/locales/…` como si `i18n` estuviera junto a esas carpetas. Si su archivo está bajo `src/` (típico), use `../locales/…` y `../public/locales/…` para que las importaciones resuelvan a las mismas rutas que `ui.stringsJson`, `uiLanguagesPath` y `ui.flatOutputDir`.

Importa `i18n.js` antes de que React renderice (por ejemplo, al principio de tu punto de entrada). Cuando el usuario cambie el idioma, llama a `await loadLocale(code)` y luego a `i18n.changeLanguage(code)`.

Mantenga `localeLoaders` **alineado con la configuración** derivándolos de `ui-languages.json` usando `makeLocaleLoadersFromManifest` (esto filtra `SOURCE_LOCALE` usando la misma normalización que `makeLoadLocale`). Cuando añade una configuración regional a `targetLocales` y ejecuta `generate-ui-languages`, el manifiesto se actualiza y sus cargadores rastrean automáticamente el cambio; no es necesario mantener un mapa codificado por separado.

Si sus paquetes JSON están bajo `public/` (configuración típica de Next.js), implemente cada cargador para obtener el archivo desde su ruta pública, por ejemplo:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Esto permite al navegador cargar JSON estático.

Para CLIs de Node sin empaquetador, use `readFileSync` dentro de un pequeño ayudante `makeFileLoader` que lea y analice el archivo JSON para cada código.

`SOURCE_LOCALE` se exporta para que cualquier otro archivo que lo necesite (por ejemplo, un selector de idioma) pueda importarlo directamente desde `'./i18n'`. Si estás migrando una configuración existente de i18next, reemplaza cualquier cadena de configuración regional fuente escrita directamente (por ejemplo, comprobaciones `'en-GB'` dispersas en los componentes) por importaciones de `SOURCE_LOCALE` desde tu archivo de inicialización de i18n.

Las importaciones nombradas (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionan igual si prefieres no usar la exportación por defecto.

`aiI18n.defaultI18nInitOptions(sourceLocale)` (o `defaultI18nInitOptions(sourceLocale)` cuando se importa por nombre) devuelve las opciones estándar para configuraciones donde la clave es el valor por defecto:

- `parseMissingKeyHandler` devuelve la propia clave, por lo que las cadenas sin traducir muestran el texto fuente.
- `nsSeparator: false` permite claves que contienen dos puntos.
- `interpolation.escapeValue: false` - seguro desactivarlo: React escapa los valores por sí mismo, y la salida en Node.js/CLI no tiene HTML que escapar.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` es la conexión **recomendada** para proyectos ai-i18n-tools: aplica recorte de claves + retroceso de interpolación de <code>"{{var}}"</code> para el idioma fuente (mismo comportamiento que el nivel inferior `wrapI18nWithKeyTrim`), opcionalmente combina claves con sufijos plurales de `translate-ui` `{sourceLocale}.json` mediante `addResourceBundle`, y luego instala `wrapT` con reconocimiento de plural desde tu `strings.json`. El archivo agrupado debe ser el plano plural para tu idioma fuente **configurado** — el mismo `sourceLocale` que en `ai-i18n-tools.config.json` y `SOURCE_LOCALE` en tu inicialización de i18n (ver Paso 4 anterior). Omite `sourcePluralFlatBundle` solo durante la inicialización (incorpóralo una vez que `translate-ui` haya emitido `{sourceLocale}.json`). `wrapI18nWithKeyTrim` solo está **obsoleto** para código de aplicación — usa `setupKeyAsDefaultT` en su lugar.

`makeLoadLocale(i18n, loaders, sourceLocale)` devuelve una función `loadLocale(lang)` asíncrona que importa dinámicamente el paquete JSON para una configuración regional y lo registra con i18next.

<a id="using-t-in-source-code"></a>
### Usar `t()` en el código fuente

Llama a `t()` con una **cadena literal** para que el script de extracción pueda encontrarla:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

El mismo patrón funciona fuera de React (Node.js, componentes del servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Reglas:**

- Solo se extraen estas formas: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clave debe ser una **cadena literal** — no se permiten variables ni expresiones como clave.
- No uses literales de plantilla para la clave: <code>{'t(`Hello ${name}`)'}</code> no es extraíble.

<a id="interpolation"></a>
### Interpolación

Usa la interpolación nativa del segundo argumento de i18next para los marcadores de posición <code>"{{var}}"</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

El comando extract analiza el **segundo argumento** cuando es un objeto literal plano y lee banderas solo para herramientas como `plurals: true` y `zeroDigit` (véase **Plurales cardinales** más abajo). Para cadenas normales, solo se usa la clave literal para el hash; las opciones de interpolación aún se pasan a i18next en tiempo de ejecución.

Si tu proyecto usa una utilidad personalizada de interpolación (por ejemplo, llamando a `t('key')` y luego pasando el resultado por una función de plantilla como `interpolateTemplate(t('Hello {{name}}'), { name })`), `setupKeyAsDefaultT` (a través de `wrapI18nWithKeyTrim`) hace innecesaria dicha utilidad — aplica interpolación <code>"{{var}}"</code> incluso cuando el idioma fuente devuelve la clave sin procesar. Migrar los sitios de llamada a `t('Hello {{name}}', { name })` y eliminar la utilidad personalizada.

<a id="cardinal-plurals-plurals-true"></a>
### Plurales cardinales (`plurals: true`)

Use el **mismo literal** que desea como texto predeterminado para desarrolladores, y pase `plurals: true` para que extract + `translate-ui` traten la llamada como un **grupo plural cardinal** (formas estilo JSON v4 de i18next `_zero` … `_other`).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (opcional): solo para herramientas; **no** es leído por i18next. Cuando es `true`, las indicaciones prefieren un `0` árabe literal en la cadena `_zero` para cada configuración regional donde exista esa forma; cuando es `false` u omitido, se utiliza una redacción natural para el cero. Elimine estas claves antes de llamar a `i18next.t` (véase `wrapT` más abajo).

**Validación:** Si el mensaje contiene **dos o más** marcadores de posición `{{…}}` distintos, **uno de ellos debe ser** `{{count}}` (el eje plural). De lo contrario, `extract` **falla** con un mensaje claro indicando archivo/línea.

**Dos conteos independientes** (por ejemplo, secciones y páginas) no pueden compartir un mismo mensaje plural — usa **dos** llamadas a `t()` (cada una con `plurals: true` y su propio `count`) y concaténalas en la interfaz.

**En** `strings.json` los grupos plurales usan **una fila por hash** con `"plural": true`, el literal original en `source` y `translated[locale]` como un objeto que asigna categorías cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) a cadenas para esa configuración regional.

**JSON plano de configuración regional:** Las filas no plurales permanecen como **oración fuente → traducción**. Las filas plurales se emiten como `<groupId>_original` (igual a `source`, para referencia) y `<groupId>_<form>` para cada sufijo, de modo que i18next resuelva los plurales de forma nativa. `translate-ui` también escribe `{sourceLocale}.json` que contiene **solo** claves planas plurales (cargue este paquete para el idioma fuente para que las claves con sufijo se resuelvan; las cadenas simples siguen usando la clave como valor por defecto). Para cada configuración regional de destino, las claves de sufijo emitidas coinciden con `Intl.PluralRules` para esa configuración regional (`requiredCldrPluralForms`): si `strings.json` omitió una categoría porque coincidía con otra tras la compactación (por ejemplo, el `many` árabe igual que `other`), `translate-ui` aún escribe todos los sufijos requeridos en el archivo plano copiándolos desde una cadena de respaldo, para que la búsqueda en tiempo de ejecución nunca falte una clave.

Tiempo de ejecución (`ai-i18n-tools/runtime`): **Llame** a `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ejecuta `wrapI18nWithKeyTrim`, registra el paquete plural opcional `translate-ui` `{sourceLocale}.json`, y luego `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` elimina `plurals` / `zeroDigit`, reescribe la clave al ID del grupo cuando sea necesario, y reenvía `count` (opcional: si hay un único marcador de posición no `{{count}}`, `count` se copia de esa opción numérica).

**Entornos antiguos:** `Intl.PluralRules` es necesario para las herramientas y para un comportamiento consistente; use polyfill si su objetivo son navegadores muy antiguos.

**No incluido en v1:** plurales ordinales (`_ordinal_*`, `ordinal: true`), plurales de intervalo, pipelines exclusivos de ICU.

<a id="language-switcher-ui"></a>
### Interfaz de selector de idioma

Use el manifiesto `ui-languages.json` para crear un selector de idioma. `ai-i18n-tools` exporta dos ayudantes de visualización:

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

`getUILanguageLabel(lang, t)` - muestra `t(englishName)` cuando está traducido, o `englishName / t(englishName)` cuando ambos difieren. Adecuado para pantallas de configuración.

`getUILanguageLabelNative(lang)` - muestra `englishName / label` (sin llamada `t()` en cada fila). Adecuado para menús de cabecera donde desea que el nombre nativo sea visible.

El manifiesto `ui-languages.json` es un array JSON de entradas <code>"{ code, label, englishName, direction }"</code> (`direction` es `"ltr"` o `"rtl"`). Ejemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

El manifiesto es generado por `generate-ui-languages` a partir de `sourceLocale` + `targetLocales` y el catálogo maestro incluido. Se escribe en `ui.flatOutputDir`. Si cambia cualquiera de las configuraciones regionales en la configuración, ejecute `generate-ui-languages` para actualizar el archivo `ui-languages.json`.

<a id="rtl-languages"></a>
### Idiomas RTL

`ai-i18n-tools` exporta `getTextDirection(lng)` y `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` establece `document.documentElement.dir` (navegador) o no hace nada (Node.js). Pase un argumento opcional `element` para dirigirse a un elemento específico.

Para cadenas que puedan contener flechas `→`, inviértalas en diseños RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## Flujo de trabajo 2 - Traducción de documentos

Diseñado principalmente para **documentación en markdown y MDX** bajo `contentPaths` (las páginas que importan a los lectores). En sitios Docusaurus también puedes traducir archivos **JSON de etiquetas** generados por `docusaurus write-translations` — estos contienen cadenas de UI de temas, barras de navegación, pies de página y plugins (i18n de la estructura), distintos del contenido principal en `docs/`. Para imágenes PNG y otros recursos rasterizados incluidos en markdown, consulta [Imágenes y recursos rasterizados en documentación traducida](#images-and-raster-assets-in-translated-docs). Los archivos SVG se traducen mediante [`translate-svg`](#cli-reference) cuando `features.translateSVG` está habilitado y se ha configurado el bloque superior `svg` — no mediante `documentations[].contentPaths`.

<a id="step-1-initialise-for-documentation"></a>
### Paso 1: Inicializar para documentación

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edite el `ai-i18n-tools.config.json` generado:

- `sourceLocale` - idioma fuente (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales` - matriz de códigos de configuración regional BCP-47 (por ejemplo, `["de", "fr", "es"]`).
- `cacheDir` - directorio de caché compartido de SQLite para todas las canalizaciones de documentación (y directorio de registro predeterminado para `--write-logs`).
- `documentations` - matriz de bloques de documentación. Cada bloque tiene `description`, `contentPaths`, `outputDir` opcionales, `jsonSource` opcional, `markdownOutput`, `segmentSplitting` opcional, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - nota corta opcional para mantenedores (qué cubre este bloque). Cuando se establece, aparece en el encabezado `translate-docs` (`🌐 …: translating …`) y en los encabezados de sección `status`.
- `documentations[].contentPaths` - directorios o archivos fuente en markdown/MDX (ver también `documentations[].jsonSource` para etiquetas JSON).
- `documentations[].outputDir` - raíz de salida traducida para ese bloque.
- `documentations[].markdownOutput.style` - `"nested"` (predeterminado), `"docusaurus"` o `"flat"` (ver [Diseños de salida](#output-layouts)).

**Primario frente a complementario:** Centra los esfuerzos de redacción y traducción en `contentPaths` — esa salida es la documentación localizada. `jsonSource` es para equipos que localizan la **estructura de Docusaurus**; ejecuta `docusaurus write-translations` cuando actualices Docusaurus o modifiques cadenas de la barra de navegación, pie de página o temas, para mantener actualizados los catálogos fuente en la carpeta del idioma predeterminado. Puedes establecer `features.translateJSON` en `false` si solo necesitas páginas traducidas y gestionarás las cadenas de interfaz de otra manera.

<a id="step-2-translate-documents"></a>
### Paso 2: Traducir documentos

```bash
npx ai-i18n-tools translate-docs
```

Esto traduce todos los archivos en cada `documentations` del bloque `contentPaths` a todos los idiomas de documentación efectivos (unión de cada `targetLocales` del bloque cuando está establecido, de lo contrario el `targetLocales` raíz). Los segmentos ya traducidos se sirven desde la caché SQLite; solo se envían al LLM los segmentos nuevos o modificados.

Para traducir un solo idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para comprobar qué necesita traducción:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### Markdown complejo y verificaciones de calidad fallidas

`translate-docs` verifica que cada segmento traducido preserve la estructura de markdown (incluido el énfasis analizado desde el documento). Párrafos que acumulan muchos elementos `bold` alrededor de `` `inline code` ``, anidan comillas invertidas dentro de negritas (por ejemplo, literales de plantilla como `` `fetch(\`/locales/${code}.json\`)` ``), o entrelazan negritas y código en una oración larga son frágiles: algunas configuraciones regionales necesitan un orden de palabras diferente, lo cual puede alterar cómo coinciden `**` y `` ` `` tras la traducción y provocar errores en la CLI como `AST mismatch`.

**Si encuentra este tipo de fallo de validación, prefiera simplificar el texto del idioma fuente** — divida el párrafo, mueva un ejemplo a un bloque de código delimitado, o describa la misma idea con menos pares anidados de negritas/código — en lugar de esperar que cada modelo y configuración regional reproduzca perfectamente un marcado en línea denso. En otras partes de esta página (notablemente en las notas del Paso 4 sobre `SOURCE_LOCALE`, cargadores y rutas `public/`), el formato es intencionadamente realista; cuando reutilice redacciones similares en sus propios documentos, manténgalas más simples al traducir ampliamente.

Para ver **qué segmentos fallaron**, con qué frecuencia y los **mensajes de error o calidad** almacenados, usa la pestaña **Errores** del Editor de caché de traducción ([Editor de caché de traducción → Errores](#translation-cache-editor-failures)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Comportamiento de caché y banderas `translate-docs`

La CLI mantiene el **seguimiento de archivos** en SQLite (hash de origen por archivo × idioma) y filas de **segmentos** (hash × idioma por fragmento traducible). Una ejecución normal omite completamente un archivo cuando el hash registrado coincide con el origen actual **y** el archivo de salida ya existe; de lo contrario, procesa el archivo y utiliza la caché de segmentos para que el texto sin cambios no llame a la API.

| Bandera                         | Efecto                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(predeterminado)*              | Omite archivos sin cambios cuando la huella + la salida en disco coinciden; usa la caché de segmentos para el resto.                                                                                                                                                  |
| `-l, --locale <codes>`        | Idiomas de destino separados por comas (cuando se omite, los valores predeterminados coinciden con la unión del `targetLocales` raíz y el `targetLocales` opcional de cada bloque `documentations[]`).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | Traduce únicamente markdown/JSON bajo esta ruta (relativa al proyecto, absoluta o patrón glob); `--file` es un alias para `--path`.                                                                                                                                 |
| `--dry-run`                   | Sin escritura de archivos ni llamadas a la API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Restringe a `markdown` o `json` (de lo contrario ambos cuando están habilitados en la configuración).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Traduce solo archivos de etiquetas JSON, o salta JSON y traduce solo markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Número máximo de idiomas objetivo en paralelo (valor predeterminado desde la configuración o valor integrado por defecto en CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Número máximo de llamadas API por lotes en paralelo por archivo (documentos; valor predeterminado desde la configuración o CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Enmascara los marcadores de énfasis de markdown como marcadores temporales antes de la traducción (opcional; desactivado por defecto).                                                                                                                                                                              |
| `--debug-failed`              | Escribe registros detallados `FAILED-TRANSLATION` en `cacheDir` cuando la validación falla.                                                                                                                                                                                        |
| `--force-update`              | Vuelve a procesar cada archivo coincidente (extrae, reensambla y escribe salidas) incluso cuando el seguimiento de archivos lo omitiría. **La caché de segmentos sigue aplicándose** — los segmentos sin cambios no se envían al LLM.                                                                                    |
| `--force`                     | Borra el seguimiento de archivos para cada archivo procesado y **no lee** la caché de segmentos para la traducción API (retraducción completa). Los nuevos resultados aún se **escriben** en la caché de segmentos.                                                                                 |
| `--stats`                     | Muestra recuentos de segmentos, recuentos de archivos rastreados y totales de segmentos por idioma, luego finaliza.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Elimina las traducciones en caché (y el seguimiento de archivos): todos los idiomas, o un solo idioma, luego finaliza.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Cómo se envía cada **lote** de segmentos al modelo y se analiza (`xml`, `json-array`, o `json-object`). Por defecto `json-array`. No cambia la extracción, marcadores de posición, validación, caché ni el comportamiento de respaldo — véase [Formato de indicación por lotes](#batch-prompt-format). |

No puedes combinar `--force` con `--force-update` (son mutuamente excluyentes).

<a id="batch-prompt-format"></a>
#### Formato del prompt por lotes

`translate-docs` envía segmentos traducibles a OpenRouter en **lotes** (agrupados por `batchSize` / `maxBatchChars`). La bandera `--prompt-format` solo cambia el **formato de transmisión** de ese lote; los tokens `PlaceholderHandler`, las comprobaciones del AST de markdown, las claves de caché SQLite y el respaldo por segmento cuando falla el análisis del lote no cambian.

| Modo                   | Mensaje del usuario                                                           | Respuesta del modelo                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: un `<seg id="N">…</seg>` por segmento (con escape XML). | Solo bloques `<t id="N">…</t>`, uno por índice de segmento.       |
| `json-array` (por defecto) | Un array JSON de cadenas, una entrada por segmento en orden.               | Un array JSON de la **misma longitud** (mismo orden).           |
| `json-object`          | Un objeto JSON `{"0":"…","1":"…",…}` con clave por índice de segmento.            | Un objeto JSON con las **mismas claves** y valores traducidos. |

El encabezado de ejecución también imprime `Batch prompt format: …` para que pueda confirmar el modo activo. Los archivos de etiquetas JSON (`jsonSource`) y los lotes de archivos SVG usan la misma configuración cuando esos pasos se ejecutan como parte de `translate-docs` (o de la fase de documentación de `sync` — `sync` no expone esta bandera; por defecto toma el valor `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Detección de segmentos duplicados y rutas en SQLite

- Las filas de segmentos están indexadas globalmente por `(source_hash, locale)` (hash = contenido normalizado). Texto idéntico en dos archivos comparte una sola fila; `translations.filepath` es metadato (último escritor), no una segunda entrada de caché por archivo.
- `file_tracking.filepath` usa claves con espacio de nombres: `doc-block:{index}:{relPath}` por bloque `documentations` (`relPath` es una ruta posix relativa a la raíz del proyecto: rutas markdown tal como se recopilan; **los archivos JSON de etiquetas usan la ruta relativa al directorio de trabajo actual (cwd) del archivo fuente**, por ejemplo `docs-site/i18n/en/code.json`, para que la limpieza pueda resolver el archivo real), y `svg-files:{relPath}` para archivos SVG bajo `translate-svg`.
- `translations.filepath` almacena rutas posix relativas al directorio de trabajo actual para segmentos markdown, JSON y SVG (SVG usa la misma forma de ruta que otros recursos; el prefijo `svg-files:…` es **solo** para `file_tracking`).
- Después de una ejecución, `last_hit_at` se borra solo para filas de segmentos **en el mismo ámbito de traducción** (respetando `--path` y los tipos habilitados) que no fueron alcanzadas, por lo que una ejecución filtrada o solo de documentación no marca como obsoletos archivos no relacionados.

<a id="output-layouts"></a>
### Distribuciones de salida

`"nested"` (predeterminado cuando se omite) — replica el árbol de origen bajo `{outputDir}/{locale}/` (por ejemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — coloca los archivos que están bajo `docsRoot` en `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, coincidiendo con el diseño habitual de i18n de Docusaurus. Establezca `documentations[].markdownOutput.docsRoot` como la raíz del origen de la documentación (por ejemplo, `"docs"`).

Páginas de documentación (primarias):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Etiquetas JSON opcionales — cadenas de la estructura Docusaurus de `jsonSource` (no el contenido del cuerpo MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

`"flat"` — coloca los archivos traducidos junto al origen con un sufijo de configuración regional, o en un subdirectorio. Los enlaces relativos entre páginas se reescriben automáticamente.

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### Enlaces de anclaje en diseño plano

La salida plana reescribe las **rutas relativas** entre páginas para cada idioma (`guide.md` → `guide.de.md`). Los **enlaces de anclaje** — la forma habitual en línea de markdown con un `#` después de la ruta — saltan a una sección dentro del archivo de destino:

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

Aquí, el destino del enlace es `setup.md`, y `#first-run` es el anclaje: debería desplazarse al encabezado correcto dentro de ese archivo.

**Por qué los enlaces de anclaje requieren atención**

- `rewriteRelativeLinks` fija el **nombre de archivo** para cada idioma (`setup.md` → `setup.de.md`).
- Muchos renderizadores derivan el slug de `#` del **texto visible del encabezado**. Después de la traducción, los encabezados varían por idioma, por lo que un slug generado automáticamente puede cambiar mientras que el enlace reescrito aún diga `#first-run` — o su anclaje en inglés `#…` ya no coincida con el slug que el renderizador construye a partir del encabezado traducido.
- Resultado: los lectores llegan al **archivo** correcto pero a la **línea incorrecta**, o el navegador no encuentra ningún encabezado coincidente.

**Qué hacer**

1. Ejecute `ai-i18n-tools write-heading-ids` en su `.md` fuente / `.mdx` antes de `translate-docs` (mismo `documentations[]` / `contentPaths` que de costumbre). Inserta anclajes HTML explícitos en la línea anterior a cada encabezado, de modo que los valores de `id` sean compartidos por cada copia traducida.
2. Apunte sus **enlaces de anclaje** en el marcado a esos identificadores estables, por ejemplo, `[label](../other.md#section-id)`, donde `section-id` coincida con el anclaje que escribió la herramienta, no con una suposición basada únicamente en palabras en inglés.

**Ejemplo**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`docs/security.md` después de `write-heading-ids` (simplificado):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Después de `translate-docs`, las rutas de archivo y los anclajes `#…` permanecen alineados en cada archivo de idioma, por ejemplo:

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

El anclaje `#tls-configuration` es el mismo en todos los idiomas porque el `id` está fijo en el origen; solo se traducen el **texto** del encabezado y la **etiqueta** del enlace.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Imágenes y recursos raster en documentos traducidos

`translate-docs` traduce segmentos de markdown (incluido el texto alternativo de las imágenes). No **copia** archivos raster (PNG, JPEG, WebP, GIF) en su directorio `outputDir` de documentación. Coloque los archivos donde apunten las URL reescritas, o ajuste las URL después de la traducción (normalmente con `markdownOutput.postProcessing.regexAdjustments`).

Los archivos **SVG** destinados a ser recursos ilustrados usan el bloque `svg` y `translate-svg` — consulte [`svg`](#svg). Las rutas incluidas en `documentations[].contentPaths` son para markdown/MDX (y etiquetas JSON opcionales), no para la traducción de archivos SVG.

**Por qué el diseño plano a menudo necesita una corrección**

Con `markdownOutput.style` `flat` y la reescritura predeterminada de enlaces relativos, los enlaces entre páginas traducidas se reescriben según la configuración regional. Los enlaces a archivos que no son markdown reciben un prefijo de profundidad para que sigan siendo relativos a cada archivo de salida (por ejemplo, `figure.png` junto al origen puede convertirse en `../figure.png` en el archivo traducido). Esa URL normalmente se resuelve **dentro** del directorio de salida únicamente. La CLI no emite el archivo binario allí, por lo que los lectores encuentran un archivo faltante a menos que copie los recursos, los sirva desde otro lugar o reescriba el enlace. Aplique sus reglas después de la traducción: `postProcessing` se ejecuta después del reensamblaje de segmentos y la reescritura de enlaces planos (consulte la fila `markdownOutput.postProcessing` en [Referencia de configuración](#configuration-reference)).

**Patrón 1 — Recurso en el mismo repositorio junto al origen en inglés (este paquete)**

Este repositorio traduce `docs/GETTING_STARTED.md` a `translated-docs/docs/GETTING_STARTED.<locale>.md`. El origen utiliza una imagen hermana, `translation-cache-editor.png`. La reescritura plana apuntaría a `translated-docs/translation-cache-editor.png`, que nunca se escribe. El `ai-i18n-tools.config.json` raíz agrega una regla que coincide con la parte final estable de la imagen en markdown (el segmento de URL `](…)`, no el texto alternativo traducido) y apunta de nuevo a `docs/`:

```json
{
  "description": "Editor screenshot: flat link rewrite points to translated-docs/; asset lives in docs/",
  "search": "\\]\\(\\.\\./translation-cache-editor\\.png\\)",
  "replace": "](../../docs/translation-cache-editor.png)"
}
```

**Patrón 2 — Carpetas de capturas de pantalla por configuración regional** (`examples/nextjs-app`)

El ejemplo de Next.js utiliza dos bloques `documentations[]` en `examples/nextjs-app/ai-i18n-tools.config.json`.

- **Documentación Docusaurus** (`markdownOutput.style` `docusaurus`): las páginas en inglés bajo `docs-site/docs/` hacen referencia a capturas de pantalla con un segmento de configuración regional fijo en la URL, por ejemplo `/img/screenshots/en-GB/screenshot.png` en `feature-showcase.md`. El postprocesamiento reemplaza ese segmento para que cada página traducida bajo `docs-site/i18n/<locale>/…/current/` se resuelva en su propia carpeta:

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/en-GB/",
  "replace": "screenshots/${translatedLocale}/"
}
```

Incluya archivos PNG correspondientes en el árbol estático de su sitio (por ejemplo, `docs-site/static/img/screenshots/<locale>/` para URLs que comienzan con `/img/screenshots/`).

- **README raíz, salida plana** (segundo bloque `documentations[]` en el mismo archivo): solo se traduce `README.md`, con `markdownOutput.style` `flat` y `outputDir` `translated-docs`, por lo que se obtiene `translated-docs/README.<locale>.md`. Las imágenes en inglés suelen usar un segmento de carpeta estable en medio de la ruta (por ejemplo, `images/screenshots/en-GB/overview.png`). El postprocesamiento reemplaza cualquier segmento único de la ruta que se encuentre entre `images/screenshots/` y el resto de la URL con el `${translatedLocale}` activo, de modo que cada README traducido apunte a `images/screenshots/de/…`, `images/screenshots/fr/…`, etc. Este patrón difiere de la regla de Docusaurus: aquí `search` coincide con **cualquier** nombre de carpeta (`[^/]+/`), no solo con `en-GB/`.

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Mantenga los archivos PNG en disco bajo `images/screenshots/<locale>/` (la misma estructura que usan las URL tras la reescritura).

**Patrón 3 — Archivo SVG** (`examples/nextjs-app`)

El mismo ejemplo habilita `features.translateSVG` y mapea los SVG de origen a la carpeta pública de la aplicación web:

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

Ejecute `translate-svg` (o `sync`) para que `images/*.svg` se convierta en salidas por configuración regional bajo `public/assets/`. Las referencias en markdown a esas URLs son independientes de `translate-docs`.

**Ejemplo mínimo solo con README** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` traduce `README.md` a `translated-docs/` usando solo `postProcessing.languageListBlock`. No define reglas de imagen — adecuado cuando el README no tiene archivos raster hermanos o solo usa URLs absolutas que su host ya sirve.

Las plantillas de reemplazo admiten marcadores de posición como `${translatedLocale}` y `${translatedBasedir}` (lista completa en la fila `markdownOutput.postProcessing.regexAdjustments` en [Referencia de configuración](#configuration-reference)).

<a id="markdown-output-path-template-placeholders"></a>
#### Marcadores de posición `pathTemplate` / `jsonPathTemplate`

Anule la ubicación donde se escriben los archivos traducidos estableciendo `documentations[].markdownOutput.pathTemplate` (markdown y MDX) o `jsonPathTemplate` (archivos de etiquetas JSON). Ambos aceptan los mismos marcadores de posición. Las rutas resueltas deben permanecer dentro del `outputDir` de ese bloque (la CLI rechaza rutas que salgan de él).

Si usa un `pathTemplate` personalizado, `rewriteRelativeLinks` por defecto es `false` a menos que lo establezca explícitamente — la reescritura de enlaces en estilo plano está pensada para el diseño integrado `flat`.

| Marcador de posición            | Función                                                                                                       | Ejemplo                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Ruta absoluta resuelta del `outputDir` de este bloque de documentación                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Código del idioma de destino (mismo formato que en la configuración / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Mismo idioma en mayúsculas | `DE`, `PT-BR` |
| `{relPath}` | Ruta del archivo fuente relativa a la raíz del proyecto, formato POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nombre del archivo **sin** extensión | `guide` para `docs/guide.md` |
| `{basename}` | Nombre de archivo **con** extensión | `guide.md` |
| `{extension}` | Extensión **incluyendo** el punto | `.md`, `.mdx` |
| `{docsRoot}` | Ruta absoluta resuelta de `markdownOutput.docsRoot` (por defecto `docs` si se omite) | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | `{relPath}` con el prefijo `docsRoot` eliminado cuando las cadenas de ruta coinciden (POSIX); de lo contrario, sin cambios | `docs/guide.md` (común); `guide.md` solo cuando se aplica el recorte |

**Ejemplo**

Fragmento de configuración:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Para la configuración regional `de` y la fuente `docs/guide.md`, con raíz del proyecto `/home/acme/repo` y `outputDir` resuelto a `/home/acme/repo/i18n`, la ruta expandida es:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Un patrón estilo `flat` que conserva solo el nombre del archivo podría usar `{stem}` y `{extension}`, por ejemplo `{outputDir}/{stem}.{locale}{extension}`, lo que produce `…/guide.de.md` bajo el `outputDir` resuelto.

---

<a id="combined-workflow-ui--docs"></a>
## Flujo de trabajo combinado (interfaz de usuario + documentación)

Habilite todas las características en una sola configuración para ejecutar ambos flujos de trabajo juntos:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

`glossary.uiGlossary` dirige la traducción de documentos al mismo catálogo `strings.json` que la interfaz de usuario para mantener la terminología consistente; `glossary.userGlossary` añade anulaciones CSV para términos del producto.

Ejecuta `npx ai-i18n-tools sync` para ejecutar una canalización: **extraer** cadenas de interfaz (si `features.extractUIStrings`), **traducir** cadenas de interfaz (si `features.translateUIStrings`), **traducir archivos SVG** (si `features.translateSVG` y un bloque `svg` están configurados), luego **traducir documentación** (cada bloque `documentations`: markdown/JSON según configuración). Omite partes con `--no-ui`, `--no-svg` o `--no-docs`. El paso de documentación acepta `--dry-run`, `-p` / `--path`, `--force` y `--force-update` (los dos últimos solo aplican cuando se ejecuta la traducción de documentación; se ignoran si pasas `--no-docs`).

Use `documentations[].targetLocales` en un bloque para traducir los archivos de ese bloque a un **subconjunto más pequeño** que la interfaz de usuario (las configuraciones regionales efectivas para la documentación son la **unión** entre bloques):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### Flujo de trabajo mixto de documentación (Docusaurus + plano)

Puede combinar múltiples canalizaciones de documentación en la misma configuración agregando más de una entrada en `documentations`. Esta es una configuración común cuando un proyecto tiene un sitio Docusaurus más archivos markdown en el nivel raíz (por ejemplo, un archivo readme del repositorio) que deben traducirse con salida plana.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

Cómo se ejecuta esto con `npx ai-i18n-tools sync`:

- Las cadenas de interfaz de usuario se extraen y traducen de `src/` a `public/locales/`.
- El primer bloque de documentación traduce **markdown** de `docs-site/docs/` a `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentación localizadas).
- Con `features.translateJSON` y `jsonSource`, ese mismo bloque también traduce el **JSON de shell de Docusaurus** ubicado en `docs-site/i18n/en/` a cada carpeta de idioma de destino —barra de navegación, pie de página y catálogos de temas/plugins—, pero no el contenido del cuerpo en MDX.
- El segundo bloque de documentación traduce `README.md` en archivos planos con sufijo de idioma bajo `translated-docs/`.
- Todos los bloques de documentación comparten `cacheDir`, por lo que los segmentos sin cambios se reutilizan entre ejecuciones para reducir llamadas a la API y costos.

---

<a id="translation-cache-editor"></a>
## Editor de caché de traducción

Ejecuta:

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

Esto inicia una interfaz web local respaldada por tu base de datos SQLite `cacheDir` configurada — la misma carpeta que la CLI usa para segmentos de documentación, registros y metadatos relacionados. Incluye las pestañas **Documentación** (segmentos de documentación en caché), **Cadenas de interfaz**, **Plurales de interfaz**, **Glosario**, **Errores**, **Problemas de Markdown** y **Estadísticas**.

![Translation Cache Editor](../../docs/translation-cache-editor.png)

Si **edita filas de caché** en esta aplicación (por ejemplo, segmentos de documentación), ejecute `sync --force-update` o el comando de traducción equivalente con `--force-update` para que las salidas en disco coincidan con el caché; si el **texto fuente** en el repositorio cambia más adelante, los hashes de los segmentos cambian y las ediciones manuales del texto anterior quedan obsoletas.

<a id="translation-cache-editor-failures"></a>
### Fallos (traducción de documentación)

La pestaña **Fallos** es solo para la traducción de **documentación**. Lee los registros de fallos escritos en SQLite cuando un segmento no pudo traducirse correctamente para una configuración regional, por ejemplo, salida del modelo vacía o inválida, errores de validación posteriores a la traducción (`AST mismatch`, fugas de marcadores de posición y comprobaciones de **calidad** similares), o una condición **fatal** que bloqueó el progreso. Le ayuda a responder: *¿qué segmento de origen falló, para qué configuración regional y modelo, y qué texto de error se registró?*

<a id="when-to-use-it"></a>
#### Cuándo usarlo

- Después de que `translate-docs` o `sync` finalice con errores, configuraciones regionales parciales o registros confusos, puede ordenar y filtrar los fallos en lugar de desplazarse solo por la salida del terminal.
- Cuando desea **priorizar el trabajo de rehacer**: ordene por **# Fallos** para que los segmentos que fallaron repetidamente en varios intentos aparezcan primero; estos son candidatos fuertes para **simplificar o reformatear** en el markdown de origen, de modo que futuras ejecuciones tengan éxito.
- Cuando necesita el **segmento exacto** —ruta del archivo, indicación de línea, hash de origen y texto completo del origen— para editar el párrafo correcto en su repositorio.

<a id="why-source-edits-matter"></a>
#### Por qué son importantes las ediciones del origen

El marcado en línea denso (**negrita** mezclada con `` `code` ``, énfasis anidados, oraciones largas con muchos fragmentos) dificulta que los modelos devuelvan traducciones que aún pasen las comprobaciones estructurales. Los segmentos con **múltiples fallos registrados** suelen mejorar más si se **reescribe o divide** el origen (o se mueven ejemplos a bloques de código delimitados) que si se vuelve a ejecutar la traducción sobre texto sin cambios. Esto concuerda con [Markdown complejo y comprobaciones de calidad fallidas](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Cómo usar la pestaña

1. Abra **Fallos** en el editor (misma sesión del navegador que [Editor de caché de traducción](#translation-cache-editor)).
2. Lea la franja de **resumen** (segmentos con algún fallo, más recuentos de segmentos con **1**, **2** o **3+** registros de fallo).
3. Filtre por **nombre de archivo** parcial, **configuración regional**, **modelo**, **error de calidad** (los valores provienen de su caché), **solo fatales** y opcionalmente por **hash de origen**, **texto de origen** o subcadena de **mensaje de error**; luego haga clic en **Aplicar**.
4. Elija **Ordenar: # Fallos** (predeterminado) u **Ordenar: ruta del archivo + número de línea**.
5. Use la paginación en la parte superior o inferior de la tabla. **Haga clic en una fila** para alternar el texto completo de origen. El control de enlace en la fila (cuando está habilitado) solicita al proceso del servidor que registre pistas de archivo/línea en el **terminal** donde se está ejecutando `ai-i18n-tools editor`; útil para saltar desde el navegador a su editor.
6. Corrija el **archivo de origen** en su proyecto, luego vuelva a ejecutar `translate-docs` o `sync`. Si la lista parece **desactualizada** después de una ejecución exitosa, ejecute `ai-i18n-tools sync --force-update` y recargue el editor (el panel de Fallos muestra la misma sugerencia).

Para depuración basada en archivos junto con la interfaz, aún puede usar `translate-docs --debug-failed` para escribir detalles de `FAILED-TRANSLATION` bajo `cacheDir` durante los reintentos — consulte [Comportamiento del caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Problemas de Markdown (comprobaciones estáticas)

La pestaña **Problemas de Markdown** enumera filas de la tabla `markdown_source_issues` de SQLite. Cada fila es un hallazgo **previo a la traducción**: por ejemplo, secuencias de delimitadores que nunca se emparejan como énfasis/tachado bajo las mismas reglas estilo CommonMark que `translate-docs` usa para enmascarar, un fragmento de código en línea abierto con comillas invertidas pero nunca cerrado, `STRONG_OUTSIDE_INLINE_CODE` cuando `**` / `__` envuelven un fragmento `` `...` `` (coloca el énfasis dentro de las comillas invertidas o usa código plano), o `STRONG_OUTSIDE_LINK` cuando `**` / `__` envuelven un enlace `[text](../url)` (coloca el negrita solo dentro del texto del enlace). Esto **no** es lo mismo que **Errores**, que registra la salida del modelo por configuración regional y problemas de validación posteriores a la traducción (`AST mismatch`, fugas de marcadores de posición y similares).

Utilice esta pestaña cuando desee corregir el **Markdown fuente** antes de gastar tokens, especialmente cuando las comprobaciones de calidad sigan fallando por problemas de estructura. Filtre por ruta de archivo (coincidencia parcial con la clave de caché, incluyendo prefijos `doc-block:{index}:`), **código de problema** o **hash de origen**; ordene por ruta de archivo + línea o por hora de escaneo más reciente. El botón de enlace registra pistas de archivo/línea en la terminal donde se está ejecutando `ai-i18n-tools editor` (misma idea que la pestaña Documentación).

**Actualizar filas:** ejecute `ai-i18n-tools check-markdown` (opcional ámbito `-p` / `--path`, `--no-cache` para omitir SQLite, `--json` para obtener salida legible por máquina en stdout con líneas legibles por humanos en stderr). De forma predeterminada, cada ejecución de `translate-docs` en un archivo markdown vuelve a escanear y reemplaza las filas para ese archivo cuando `documentations[].warnMarkdownSourceIssues` no está establecido en `false`. Borrar todas las traducciones para una ruta de archivo en caché elimina también las filas de problemas de Markdown para esa ruta como parte del mismo proceso de limpieza que los errores.

---

<a id="configuration-reference"></a>
## Referencia de configuración

<a id="sourcelocale"></a>
### `sourceLocale`

Código BCP-47 para el idioma de origen (por ejemplo, `"en-GB"`, `"en"`, `"pt-BR"`). No se genera ningún archivo de traducción para esta configuración regional — la propia cadena clave es el texto fuente.

**Debe coincidir** con `SOURCE_LOCALE` exportado desde su archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Matriz de códigos de configuración regional BCP-47 a los que traducir (por ejemplo, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` es la lista principal de configuraciones regionales para la traducción de la interfaz de usuario y la lista predeterminada para bloques de documentación. Usa `generate-ui-languages` para generar el manifiesto `ui-languages.json` a partir de `sourceLocale` + `targetLocales`.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (opcional)

Ruta al manifiesto `ui-languages.json` utilizado para nombres mostrados, filtrado por configuración regional y postprocesamiento de listas de idiomas. Si se omite, la CLI busca el manifiesto en `ui.flatOutputDir/ui-languages.json`.

Utiliza esto cuando:

- El manifiesto está fuera de `ui.flatOutputDir` y necesitas indicar explícitamente a la CLI dónde está.
- Deseas que `markdownOutput.postProcessing.languageListBlock` genere etiquetas de configuración regional a partir del manifiesto.
- `extract` debe fusionar entradas `englishName` del manifiesto en `strings.json` (requiere `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (opcional)

Número máximo de **configuraciones regionales destino** traducidas simultáneamente (`translate-ui`, `translate-docs`, `translate-svg` y los pasos correspondientes dentro de `sync`). Si se omite, la CLI usa **4** para traducción de interfaz de usuario y **3** para traducción de documentación (valores predeterminados integrados). Puedes anularlo por ejecución con `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (opcional)

**translate-docs** y **translate-svg** (y el paso de documentación de `sync`): número máximo de solicitudes por lotes (**batch**) paralelas a OpenRouter por archivo (cada lote puede contener muchos segmentos). Valor predeterminado: **4** si se omite. Ignorado por `translate-ui`. Anulable con `-b` / `--batch-concurrency`. En `sync`, `-b` se aplica solo al paso de traducción de documentación.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (opcional)

Número máximo de archivos procesados simultáneamente **dentro de una sola configuración regional** durante `translate-docs` y `sync`. Cuando se establece en un valor mayor que **1**, los archivos dentro de la misma configuración regional se procesan en paralelo usando un semáforo para controlar el uso de memoria. Valor predeterminado **1** (procesamiento secuencial) si se omite. Valores más altos pueden mejorar significativamente el rendimiento en operaciones limitadas por E/S, especialmente cuando todos los segmentos ya están en caché (sin necesidad de llamadas a la API).

**Ejemplo:**

```json
{
  "fileConcurrency": 4
}
```

**Caso de uso:** Establezca esto en `2-4` al ejecutar `sync --force-update` con aciertos del 100 % en la caché para reducir el tiempo total de procesamiento. La mejora es más notable con muchos archivos pequeños.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (opcional)

Lotes de segmentos para traducción de documentos: número de segmentos por solicitud a la API y límite máximo de caracteres. Valores predeterminados: **20** segmentos, **4096** caracteres (cuando se omiten).

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  URL base de la API OpenRouter. Valor predeterminado: `https://openrouter.ai/api/v1`.
- `translationModels`
  Lista ordenada preferida de IDs de modelos. Se intenta primero el primero; las entradas posteriores son alternativas en caso de error. Solo para `translate-ui`, también puedes establecer `ui.preferredModel` para probar un modelo antes de esta lista (ver `ui`).
- `defaultModel`
  Modelo principal único heredado. Se usa solo cuando `translationModels` no está establecido o está vacío.
- `fallbackModel`
  Modelo de respaldo único heredado. Se usa después de `defaultModel` cuando `translationModels` no está establecido o está vacío.
- `maxTokens`
  Número máximo de tokens de finalización por solicitud. Valor predeterminado: `8192`.
- `temperature`
  Temperatura de muestreo. Valor predeterminado: `0.2`.
- `requestTimeoutMs`
  Tiempo máximo en milisegundos para esperar cada solicitud HTTP a OpenRouter (completados de chat y llamadas internas `GET /models`). Valor predeterminado: `30000` (30 segundos).

**Por qué usar múltiples modelos:** Diferentes proveedores y modelos tienen costos variables y ofrecen distintos niveles de calidad según los idiomas y configuraciones regionales. Configura `openrouter.translationModels` **como una cadena ordenada de respaldo** (en lugar de un solo modelo), para que la CLI pueda intentar el siguiente modelo si falla una solicitud.

Considera la lista siguiente como una **base** que puedes ampliar: si la traducción para una configuración regional específica es deficiente o falla, investiga qué modelos admiten bien ese idioma o escritura (consulta recursos en línea o la documentación de tu proveedor) y añade esos IDs de OpenRouter como alternativas adicionales.

Esta lista fue **probada para una amplia cobertura de configuraciones regionales** (por ejemplo, en **abril de 2026** durante la traducción de **36** configuraciones regionales en un gran proyecto de documentación); sirve como valor predeterminado práctico, pero no se garantiza que funcione bien en todas las configuraciones regionales.

Ejemplo `translationModels` (mismos valores predeterminados que `npx ai-i18n-tools init`):

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
]
```

Establezca `OPENROUTER_API_KEY` en su entorno o en el archivo `.env`.

Antes de cambiar `translationModels`, ejecute `npx ai-i18n-tools check-models` para verificar cada ID de modelo configurado contra el catálogo en vivo de OpenRouter (`GET /models`). Este informa los ID que faltan o que han expirado `expiration_date`, lista los modelos válidos con precios estimados de entrada/salida (USD por cada 1 millón de tokens) y finaliza con un estado distinto de cero cuando algún ID configurado no es válido. Requiere `OPENROUTER_API_KEY`.

<a id="features"></a>
### `features`

| Campo                | Flujo de trabajo | Descripción                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Analiza el código fuente en busca de `t("…")` / `i18n.t("…")`, combina la descripción opcional `package.json` y (si está habilitado) los valores `ui-languages.json` `englishName` en `strings.json`. |
| `translateUIStrings` | 1        | Traduce las entradas de `strings.json` y escribe archivos JSON por configuración regional.                                                                                                  |
| `translateMarkdown`  | 2        | Traduce archivos `.md` / `.mdx` (planos o documentos Docusaurus).                                                                                                                                   |
| `translateJSON`      | 2        | JSON de etiquetas de Docusaurus de `docusaurus write-translations` (interfaz de tema/barra de navegación/pie de página/plugins), **no** los cuerpos de páginas markdown.                                             |
| `translateSVG`       | 2        | Traduce archivos `.svg` (requiere el bloque `svg` de nivel superior).                                                                                                       |

**Traduce** archivos SVG con `translate-svg` cuando `features.translateSVG` es verdadero y se configura un bloque superior `svg`. El comando `sync` ejecuta ese paso cuando ambos están establecidos (a menos que `--no-svg`).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Directorios o patrones glob (relativos al directorio actual) escaneados en busca de llamadas a `t("…")`. Admite patrones como `src/` o `["src/**/*.ts"]`.
- `stringsJson`  
  Ruta al archivo del catálogo maestro. Actualizado por `extract`.
- `flatOutputDir`  
  Directorio donde se escriben los archivos JSON por idioma (`de.json`, etc.).
- `preferredModel`  
  Opcional. ID del modelo OpenRouter que se intenta primero solo para `translate-ui`; luego `openrouter.translationModels` (o modelos antiguos) en orden, sin duplicar este ID.
- `reactExtractor.funcNames`  
  Nombres adicionales de funciones para escanear (predeterminado: `["t", "i18n.t"]`).
- `reactExtractor.extensions`  
  Extensiones de archivo a incluir (predeterminado: `[".js", ".jsx", ".ts", ".tsx"]`).
- `reactExtractor.includePackageDescription`  
  Cuando `true` (predeterminado), `extract` también incluye `package.json` `description` como cadena de interfaz de usuario cuando está presente.
- `reactExtractor.packageJsonPath`  
  Ruta personalizada al archivo `package.json` utilizado para la extracción opcional de descripciones.
- `reactExtractor.includeUiLanguageEnglishNames`

Cuando `true` (predeterminado `false`), `extract` también agrega cada `englishName` del manifiesto en `uiLanguagesPath` a `strings.json` cuando no está ya presente en el escaneo del código fuente (mismas claves de hash). Requiere `uiLanguagesPath` apuntando a un `ui-languages.json` válido.

| Campo         | Descripción                                               |
|---------------|-----------------------------------------------------------|
| `sourceRoots` | Directorios o patrones glob (relativos al directorio actual) escaneados en busca de llamadas a `t("…")`. |
| `stringsJson` | Ruta al archivo de catálogo maestro. Actualizado por `extract`.    |

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
Directorio de caché SQLite (compartido por todos los bloques `documentations`). Reutilizado entre ejecuciones. Si estás migrando desde una caché personalizada de traducción de documentos, archívala o elimínala — `cacheDir` crea su propia base de datos SQLite y no es compatible con otros esquemas.

<a id="best-practice-for-git-exclusions"></a>
#### Mejor práctica para exclusiones en git:

- Excluya el contenido de la carpeta de caché de traducción (por ejemplo, usando `.gitignore` o `.git/info/exclude`) para evitar confirmar artefactos temporales de caché.
- Mantenga `cache.db` (no eliminarlo habitualmente), ya que conservar la caché SQLite evita volver a traducir segmentos sin cambios. Esto ahorra tiempo de ejecución y costos de API al actualizar o modificar software que usa `ai-i18n-tools`.
- Excluya archivos temporales y de registro para evitar confirmar archivos de respaldo y depuración.

<br/>

**Ejemplo:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="documentations"></a>
### `documentations`

Matriz de bloques de la canalización de documentación. `translate-docs` y la fase de documentación de `sync` **procesan cada** bloque en orden.

- `description`
Nota opcional legible por humanos para este bloque (no se usa para traducción). Se antepone en el encabezado `translate-docs` `🌐` cuando está definido; también se muestra en los encabezados de sección de `status`.
- `contentPaths`
Cuerpos de páginas en Markdown/MDX que se traducirán (`translate-docs` escanea estos para `.md` / `.mdx`). Admite **rutas de directorio o patrones glob** (por ejemplo, `"docs/**/*.md"`, `"guides/*.mdx"`). Es ahí de donde proviene el texto documental localizado.
- `outputDir`
Directorio raíz para la salida traducida de este bloque.
- `sourceFiles`
Alias opcional que se combina en `contentPaths` al cargar.
- `targetLocales`
Subconjunto opcional de idiomas solo para este bloque (en caso contrario, se usa el `targetLocales` raíz). Los idiomas de documentación efectivos son la unión entre todos los bloques.
- `jsonSource`
Opcional. Directorio fuente para los catálogos JSON de etiquetas de Docusaurus para este bloque (por ejemplo, `"i18n/en"` de `docusaurus write-translations`). Los cuerpos de página siempre provienen de `contentPaths`; `jsonSource` solo proporciona JSON de interfaz/estructura, no MDX.
- `markdownOutput.style`
`"nested"` (por defecto), `"docusaurus"` o `"flat"`.
- `markdownOutput.docsRoot`
Raíz de documentación fuente para el diseño de Docusaurus (por ejemplo, `"docs"`).
- `markdownOutput.pathTemplate`
Ruta personalizada de salida para markdown. Marcadores de posición: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `markdownOutput.jsonPathTemplate`
Ruta personalizada de salida JSON para archivos de etiquetas. Admite los mismos marcadores de posición que `pathTemplate`.
- `markdownOutput.flatPreserveRelativeDir`
Para el estilo `flat`, mantener los subdirectorios fuente para que los archivos con el mismo nombre base no colisionen.
- `markdownOutput.rewriteRelativeLinks`
Reescribir enlaces relativos tras la traducción (activado automáticamente para el estilo `flat`).
- `markdownOutput.linkRewriteDocsRoot`
Raíz del repositorio utilizada al calcular los prefijos de reescritura de enlaces planos. Por lo general, déjelo como `"."` a menos que sus documentos traducidos estén ubicados bajo una raíz de proyecto diferente.
- `markdownOutput.postProcessing`
Transformaciones opcionales en el **cuerpo markdown** (la cabecera YAML se conserva). Se ejecutan después de la recombinación de segmentos y la reescritura de enlaces planos, y antes de `addFrontmatter`.
- `segmentSplitting`
Mismo nivel que `markdownOutput` (por bloque `documentations[]`). Segmentos opcionales más detallados para la extracción de `translate-docs`: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Cuando `enabled` es `true` (valor predeterminado cuando se omite `segmentSplitting`), se dividen párrafos densos, tablas GFM con barras verticales (el primer fragmento incluye cabecera, separador y primera fila de datos) y listas largas; las subpartes se vuelven a unir con saltos de línea simples (`tightJoinPrevious`). Establezca `"enabled": false` para usar un segmento por bloque del cuerpo delimitado únicamente por líneas en blanco.
- `warnMarkdownSourceIssues`
Cuando `true` (valor predeterminado si se omite), cada ejecución de `translate-docs` vuelve a escanear los segmentos markdown en busca de delimitadores peligrosos o código en línea sin cerrar, imprime advertencias en la terminal y reemplaza las filas `markdown_source_issues` para la ruta del archivo en caché de ese archivo. Establezca `false` para omitir advertencias y actualizaciones de SQLite para este bloque.
- `markdownOutput.postProcessing.regexAdjustments`
Lista ordenada de `{ "description"?, "search", "replace" }`. `search` es un patrón regex (una cadena simple usa la bandera `g`, o `/pattern/flags`). `replace` admite marcadores como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label" }` — el traductor busca la primera línea que contiene `start` y la línea `end` correspondiente, luego reemplaza ese fragmento con un selector de idioma canónico. `label` controla el origen de las etiquetas del manifiesto: `"local"` (predeterminado, usa `ui-languages.json` `label`) o `"english"` (usa `englishName`). Los enlaces se construyen con rutas relativas al archivo traducido; cuando no se configura ningún manifiesto, las etiquetas provienen de `localeDisplayNames` y los códigos de configuración regional.
- `addFrontmatter`
Cuando `true` (valor predeterminado si se omite), los archivos markdown traducidos incluyen claves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, y cuando al menos un segmento tiene metadatos del modelo, `translation_models` (lista ordenada de identificadores de modelos OpenRouter utilizados). Establézcalo en `false` para omitirlos.

<br/>

**Ejemplo (canalización plana para README — rutas de capturas de pantalla + contenedor opcional de lista de idiomas):**

```json
"markdownOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

<a id="svg"></a>
### `svg`

Rutas y estructura de nivel superior para archivos SVG. La traducción solo se ejecuta cuando `features.translateSVG` es verdadero (mediante `translate-svg` o la etapa SVG de `sync`).

| Campo                         | Descripción                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | Uno o más directorios **o patrones globales** (por ejemplo, `"images/*.svg"`, `"**/icons/*.svg"`). Los patrones se resuelven respecto a la raíz del proyecto y se exploran recursivamente en busca de archivos `.svg`.                                                                                       |
| `outputDir`                   | Directorio raíz para la salida SVG traducida.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` o `"nested"` cuando `pathTemplate` no está definido.                                                                                                                                                                                                                               |
| `pathTemplate`                | Ruta personalizada de salida SVG. Marcadores de posición: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `forceLowercase` | Texto traducido en minúsculas durante la reensamblaje SVG. Útil para diseños que dependen de etiquetas completamente en minúsculas.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Campo          | Descripción                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Ruta a `strings.json` - crea automáticamente un glosario a partir de traducciones existentes.                                                                                                 |
| `userGlossary` | Ruta a un archivo CSV con columnas `Original language string` (o `en`), `locale`, `Translation` - una fila por término fuente y configuración regional objetivo (`locale` puede ser `*` para todos los destinos). |

**Genere un archivo CSV de glosario vacío:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## Referencia de la CLI

- `version`
Muestra la versión CLI y la marca de tiempo de compilación (la misma información que `-V` / `--version` en el programa raíz).

- `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`
Escribe un archivo de configuración inicial (incluye `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` y `documentations[].addFrontmatter`). `--with-translate-ignore` crea un `.translate-ignore` inicial.

- `check-models`
Valida cada identificador de modelo OpenRouter configurado contra `GET /models` (pertenencia al catálogo, `expiration_date`, USD por cada millón de tokens para solicitud/completado). Requiere `OPENROUTER_API_KEY`. Finaliza con error si falta algún identificador configurado o ha expirado. Respeta `openrouter.requestTimeoutMs` para la solicitud del catálogo.

- `extract`
Actualiza `strings.json` a partir de literales `t("…")` / `i18n.t("…")`, descripción opcional `package.json` y entradas opcionales `englishName` del manifiesto (véase `ui.reactExtractor`). Requiere `features.extractUIStrings`.

- `generate-ui-languages [--master <path>] [--dry-run]`
Escribe `ui-languages.json` en `ui.flatOutputDir` (o en `uiLanguagesPath` si se establece) usando `sourceLocale` + `targetLocales` y el `data/ui-languages-complete.json` incluido (o `--master`). Emite advertencias y genera marcadores `TODO` para configuraciones regionales que falten en el archivo maestro. Si tiene un manifiesto existente con valores personalizados de `label` o `englishName`, estos serán reemplazados por los valores predeterminados del catálogo maestro; revise y ajuste el archivo generado después.

- `translate-docs …`
Traduce markdown/MDX y JSON para cada bloque `documentations` (`contentPaths`, opcional `jsonSource`). `-j`: número máximo de configuraciones regionales en paralelo; `-b`: número máximo de llamadas API por lotes en paralelo por archivo. `--prompt-format`: formato de transmisión por lotes (`xml` \| `json-array` \| `json-object`). Vea [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags) y [Formato del lote de prompts](#batch-prompt-format).

- `write-heading-ids …`
**Sin API.** Requiere al menos un bloque `documentations[]`. Recopila `.md` / `.mdx` bajo el `contentPaths` de cada bloque (respeta `.translate-ignore`). Inserta una línea de anclaje HTML `<a id="slug"></a>` inmediatamente **antes** de cada encabezado ATX plano `#` (omite encabezados dentro de bloques de código con delimitadores). `-p` / `--path` o `-f` / `--file`: limita a un archivo o directorio relativo al proyecto. `--slug-style`: `github` (por defecto; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Con `pymdown`, opcional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: muestra solo los cambios.

- `strip-md-bold-inline …`
**Sin API.** Requiere al menos un bloque `documentations[]`. Elimina `**` alrededor del código en línea en `.md` / `.mdx` bajo el `contentPaths` de cada bloque (respeta `.translate-ignore`). `-p` / `--path` o `-f` / `--file`, `--dry-run`, `--no-backup` (omite `.backup.*` con marca de tiempo antes de sobrescribir).

- `check-markdown …`
**Sin API.** Analiza markdown/MDX bajo el `contentPaths` de cada bloque `documentations[]` (igual descubrimiento que `translate-docs`, respeta `.translate-ignore`): emparejamiento de delimitadores, código en línea sin cerrar, y `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK` cuando `**`/`__` envuelven un fragmento `` `...` `` o un enlace `[text](../url)`. `-p` / `--path` o `-f` / `--file`: ámbito opcional. Imprime líneas `relativePath:line: [ISSUE_CODE] message` en **stderr**; código de salida **1** si hay algún problema. `--json`: informe JSON en **stdout**. Escribe `markdown_source_issues` en `cacheDir` a menos que `--no-cache`. `-v` añade hashes de origen a las líneas de stderr.

- `translate-svg …`
Traduce archivos SVG configurados en `config.svg` (separado de la documentación). Requiere `features.translateSVG`. Mismas ideas de caché que la documentación; admite `--no-cache` para omitir lecturas/escrituras de SQLite en esa ejecución. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.

- `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`
Traduce solo cadenas de interfaz. `--force`: vuelve a traducir todas las entradas por configuración regional (ignora traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a API. `-j`: número máximo de configuraciones regionales en paralelo. Requiere `features.translateUIStrings`.

- `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`
Ejecuta `extract` **primero** (requiere `features.extractUIStrings`) para que `strings.json` coincida con el origen, luego revisión mediante LLM de las cadenas de interfaz **origen-destino** (ortografía, gramática). Las **sugerencias de terminología** provienen únicamente del archivo CSV `glossary.userGlossary` (mismo ámbito que `translate-ui` — no `strings.json` / `uiGlossary`, para no reforzar copia incorrecta como glosario). Usa OpenRouter (`OPENROUTER_API_KEY`). Solo orientativo (salida con código **0** al finalizar). Escribe `lint-source-results_<timestamp>.log` bajo `cacheDir` como informe **legible por humanos** (resumen, problemas y filas **OK** por cadena); la terminal muestra solo recuentos resumidos y problemas (sin líneas `[ok]` por cadena). Imprime el nombre del archivo de registro en la última línea. `--json`: informe JSON completo legible por máquina solo en stdout (el archivo de registro sigue siendo legible por humanos). `--dry-run`: aún ejecuta `extract`, luego imprime solo el plan por lotes (sin llamadas a API). `--chunk`: cadenas por lote de API (por defecto **50**). `-j`: número máximo de lotes en paralelo (por defecto `concurrency`). Con `--json`, la salida estilo humano va a stderr. Los enlaces usan `path:line` como el botón «enlace» de las cadenas de interfaz `editor`.

- `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`
Exporta `strings.json` a XLIFF 2.0 (una `.xliff` por configuración regional de destino). `-o` / `--output-dir`: directorio de salida (por defecto: misma carpeta que el catálogo). `--untranslated-only`: solo unidades sin traducción para esa configuración regional. Solo lectura; sin API.

- `sync …`
Extrae (si está habilitado), luego traducción de interfaz, luego `translate-svg` cuando `features.translateSVG` y `config.svg` están configurados, luego traducción de documentación — a menos que se omita con `--no-ui`, `--no-svg` o `--no-docs`. Banderas compartidas: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (solo agrupación de documentación), `--force` / `--force-update` (solo documentación; mutuamente excluyentes cuando se ejecuta la documentación). La fase de documentación también transmite `--emphasis-placeholders` y `--debug-failed` (mismo significado que `translate-docs`). `--prompt-format` no es una bandera `sync`; el paso de documentación usa el valor predeterminado integrado (`json-array`).

- `status [--max-columns <n>]`
Cuando `features.translateUIStrings` está activado, imprime la cobertura de interfaz por configuración regional (`Translated` / `Missing` / `Total`). Luego imprime el estado de traducción de markdown por archivo × configuración regional (sin filtro `--locale`; las configuraciones regionales provienen de la configuración). Listas grandes de configuraciones regionales se dividen en tablas repetidas de hasta `n` columnas de configuraciones regionales (por defecto **9**) para mantener líneas estrechas en la terminal.

- `statistics [--max-columns <n>]`
Muestra la caché de documentación y las estadísticas de `strings.json` (agregados iguales a los del Editor de caché de traducción → **Estadísticas**). `--max-columns`: número máximo de columnas por configuración regional por modelo × tabla de configuraciones regionales (por defecto coincide con el editor).

- `cleanup [--dry-run] [--no-backup] [--backup <path>]`
Ejecuta primero `sync --force-update` (extrae, interfaz de usuario, SVG, documentos), luego elimina las filas de segmentos obsoletas (`last_hit_at` nulo / ruta de archivo vacía); elimina las filas de `file_tracking` cuya ruta de origen resuelta no existe en el disco; elimina las filas de traducción cuyos metadatos `filepath` apuntan a un archivo faltante. Registra tres conteos (obsoletos, `file_tracking` huérfanos, traducciones huérfanas). Crea una copia de seguridad de SQLite con marca de tiempo en el directorio de caché a menos que se use `--no-backup`.

- `clean-temp [-r|--root <path>] [-f|--force] [--dry-run]`
**Sin configuración.** Recorre un árbol de directorios (por defecto: directorio actual) buscando `*.log` y `cache.db.backup*.sqlite`, imprime rutas de `./…` como `find -print`. Si hay coincidencias: solicita confirmación `Delete these files? (y/n)` a menos que se use `-f` / `--force` (eliminar sin confirmación). Si no hay coincidencias: sale sin preguntar. `--dry-run`: solo lista, sin preguntas ni eliminaciones (anula `--force`).

- `editor [-p <port>] [--no-open]`
Abre un editor web local para la caché, `strings.json` y el archivo CSV del glosario. Con `--no-open`, el navegador predeterminado no se abre automáticamente.  
**Nota:** Si editas una entrada en el editor de caché, debes ejecutar un `sync --force-update` para reescribir los archivos de salida con la entrada de caché actualizada. Además, si el texto fuente cambia más adelante, la edición manual se perderá porque se genera una nueva clave de caché.

- `glossary-generate [-o <path>]`
Escribe una plantilla `glossary-user.csv` vacía. `-o`: anula la ruta de salida (por defecto: `glossary.userGlossary` del archivo de configuración, o `glossary-user.csv`).

Todos los comandos aceptan `-c <path>` para especificar un archivo de configuración no predeterminado, `-v` para salida detallada y `-w` / `--write-logs [path]` para duplicar la salida de consola en un archivo de registro (ruta por defecto: dentro del directorio raíz `cacheDir`).

El programa principal también admite `-V` / `--version` y `-h` / `--help`; `ai-i18n-tools help [command]` muestra la misma ayuda por comando que `ai-i18n-tools <command> --help`.

---

<a id="environment-variables"></a>
## Variables de entorno

| Variable               | Descripción                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **Obligatorio.** Tu clave de API de OpenRouter.                     |
| `OPENROUTER_BASE_URL`   | Anula la URL base de la API.                               |
| `I18N_SOURCE_LOCALE`    | Anula `sourceLocale` en tiempo de ejecución.               |
| `I18N_TARGET_LOCALES`   | Códigos de configuración regional separados por comas para anular `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Nivel del registrador (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Cuando vale `1`, desactiva los colores ANSI en la salida del registro.             |
| `I18N_LOG_SESSION_MAX`  | Número máximo de líneas guardadas por sesión de registro (por defecto `5000`).           |
