# ai-i18n-tools: Introducción

`ai-i18n-tools` proporciona dos flujos de trabajo independientes y componibles:

- **Flujo de trabajo 1 - Traducción de interfaz de usuario**: extrae llamadas `t("…")` de cualquier fuente JS/TS, tradúcelas mediante OpenRouter y escribe archivos JSON planos por configuración regional listos para i18next.
- **Flujo de trabajo 2 - Traducción de documentos**: traduce archivos markdown (MDX) y archivos de etiquetas JSON de Docusaurus a cualquier número de configuraciones regionales, con caché inteligente. Los recursos **SVG** usan `features.translateSVG`, el bloque `svg` de nivel superior y `translate-svg` (véase [referencia de CLI](#cli-reference)).

Ambos flujos de trabajo utilizan OpenRouter (cualquier LLM compatible) y comparten un único archivo de configuración.

---

<!-- INICIO doctoc generado TOC por favor mantenga el comentario aquí para permitir la actualización automática -->
<!-- NO EDITAR ESTA SECCIÓN, EN SU LUGAR REEJECUTAR doctoc PARA ACTUALIZAR -->
**Tabla de Contenidos**

- [Instalación](#installation)
- [Inicio rápido](#quick-start)
- [Flujo de trabajo 1 - Traducción de interfaz](#workflow-1---ui-translation)
  - [Paso 1: Inicializar](#step-1-initialise)
  - [Paso 2: Extraer cadenas](#step-2-extract-strings)
  - [Paso 3: Traducir cadenas de interfaz](#step-3-translate-ui-strings)
  - [Exportar a XLIFF 2.0 (opcional)](#exporting-to-xliff-20-optional)
  - [Paso 4: Conectar i18next en tiempo de ejecución](#step-4-wire-i18next-at-runtime)
  - [Usar `t()` en el código fuente](#using-t-in-source-code)
  - [Interpolación](#interpolation)
  - [Interfaz de selector de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Flujo de trabajo 2 - Traducción de documentos](#workflow-2---document-translation)
  - [Paso 1: Inicializar](#step-1-initialise-1)
  - [Paso 2: Traducir documentos](#step-2-translate-documents)
    - [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Diseños de salida](#output-layouts)
- [Flujo de trabajo combinado (interfaz + documentos)](#combined-workflow-ui--docs)
- [Referencia de configuración](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (opcional)](#uilanguagespath-optional)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (opcional)](#svg-optional)
  - [`glossary`](#glossary)
- [Referencia de CLI](#cli-reference)
- [Variables de entorno](#environment-variables)

<!-- FIN doctoc generado TOC por favor mantenga el comentario aquí para permitir la actualización automática -->

## Instalación

El paquete publicado es **solo ESM**. Usa `import`/`import()` en Node.js o tu empaquetador; no uses `require('ai-i18n-tools')` **.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools incluye su propio extractor de cadenas. Si anteriormente utilizabas `i18next-scanner`, `babel-plugin-i18next-extract` o similares, puedes eliminar esas dependencias de desarrollo después de la migración.

Establece tu clave API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O crea un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Inicio Rápido

La plantilla `init` por defecto (`ui-markdown`) habilita solo la extracción y traducción de **UI**. La plantilla `ui-docusaurus` habilita la traducción de **documentos** (`translate-docs`). Usa `sync` cuando quieras un comando que ejecute la extracción, la traducción de UI, la traducción SVG opcional independiente y la traducción de documentación de acuerdo con tu configuración.

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

### Scripts `package.json` recomendados

Con el paquete instalado localmente, puedes usar los comandos CLI directamente en los scripts (no se necesita `npx`):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

## Flujo de trabajo 1 - Traducción de UI

Diseñado para cualquier proyecto JS/TS que use i18next: aplicaciones React, Next.js (componentes del cliente y del servidor), servicios de Node.js, herramientas de CLI.

### Paso 1: Inicializar

```bash
npx ai-i18n-tools init
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown`. Edítalo para establecer:

- `sourceLocale` - código BCP-47 de tu idioma fuente (por ejemplo, `"en-GB"`). **Debe coincidir** con `SOURCE_LOCALE` exportado desde tu archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - matriz de códigos BCP-47 para tus idiomas de destino (por ejemplo, `["de", "fr", "pt-BR"]`). Ejecuta `generate-ui-languages` para crear el manifiesto `ui-languages.json` a partir de esta lista.
- `ui.sourceRoots` - directorios a escanear en busca de llamadas a `t("…")` (por ejemplo, `["src/"]`).
- `ui.stringsJson` - ubicación donde escribir el catálogo maestro (por ejemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - ubicación donde escribir `de.json`, `pt-BR.json`, etc. (por ejemplo, `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID del modelo OpenRouter a intentar **primero** solo para `translate-ui`; si falla, el CLI continúa con `openrouter.translationModels` (o `defaultModel` / `fallbackModel` heredados) en orden, omitiendo duplicados.

### Paso 2: Extraer cadenas

```bash
npx ai-i18n-tools extract
```

Escanea todos los archivos JS/TS bajo `ui.sourceRoots` en busca de llamadas `t("literal")` y `i18n.t("literal")`. Escribe (o fusiona en) `ui.stringsJson`.

El escáner es configurable: añade nombres de funciones personalizadas a través de `ui.reactExtractor.funcNames`.

### Paso 3: Traducir cadenas de UI

```bash
npx ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes a OpenRouter para cada idioma objetivo, escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. Cuando `ui.preferredModel` está configurado, ese modelo se intenta antes de la lista ordenada en `openrouter.translationModels` (la traducción de documentos y otros comandos aún utilizan solo `openrouter`).

Para cada entrada, `translate-ui` almacena el **id del modelo OpenRouter** que tradujo correctamente cada configuración regional en un objeto opcional `models` (con las mismas claves de configuración regional que en `translated`). Las cadenas editadas en el comando local `editor` se marcan con el valor centinela `user-edited` en `models` para esa configuración regional. Los archivos planos por configuración regional bajo `ui.flatOutputDir` permanecen como **cadena fuente → traducción** únicamente; no incluyen `models` (por lo que los paquetes en tiempo de ejecución permanecen sin cambios).

> **Nota sobre el uso del Editor de Caché:** Si editas una entrada en el editor de caché, necesitas ejecutar un `sync --force-update` (o el comando `translate` equivalente con `--force-update`) para reescribir los archivos de salida con la entrada de caché actualizada. Además, ten en cuenta que si el texto fuente cambia más tarde, tu edición manual se perderá porque se generará una nueva clave de caché (hash) para la nueva cadena fuente.

### Exportar a XLIFF 2.0 (opcional)

Para entregar las cadenas de interfaz a un proveedor de traducción, un sistema de gestión de traducción (TMS) o una herramienta CAT, exporte el catálogo como **XLIFF 2.0** (un archivo por configuración regional de destino). Este comando es **de solo lectura**: no modifica `strings.json` ni llama a ninguna API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Por defecto, los archivos se escriben junto a `ui.stringsJson`, con nombres como `strings.de.xliff`, `strings.pt-BR.xliff` (nombre base de su catálogo + configuración regional + `.xliff`). Use `-o` / `--output-dir` para escribir en otra ubicación. Las traducciones existentes de `strings.json` aparecen en `<target>`; las configuraciones regionales faltantes usan `state="initial"` sin `<target>` para que las herramientas puedan completarlas. Use `--untranslated-only` para exportar solo las unidades que aún necesitan traducción para cada configuración regional (útil para lotes enviados a proveedores). `--dry-run` muestra las rutas sin escribir archivos.

### Paso 4: Conectar i18next en tiempo de ejecución

Crea tu archivo de configuración i18n utilizando los ayudantes exportados por `'ai-i18n-tools/runtime'`:

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

// initialize i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// setup the key-as-default translation
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

**Mantenga alineados tres valores:** `sourceLocale` en **`ai-i18n-tools.config.json`**, **`SOURCE_LOCALE`** en este archivo, y el JSON plano plural que **`translate-ui`** escribe como **`{sourceLocale}.json`** en su directorio de salida plano (habitualmente `public/locales/`). Use ese mismo nombre base en el **`import`** estático (ejemplo anterior: `en-GB` → `en-GB.json`). El campo **`lng`** en **`sourcePluralFlatBundle`** debe ser igual a **`SOURCE_LOCALE`**. Las rutas ES estáticas **`import`** no pueden usar variables; si cambia la configuración regional de origen, actualice **`SOURCE_LOCALE`** y la ruta de importación conjuntamente. Alternativamente, cargue ese archivo con un **`import(\`./public/locales/${SOURCE_LOCALE}.json\`)`** dinámico, **`fetch`**, o **`readFileSync`** para que la ruta se construya a partir de **`SOURCE_LOCALE`**.

El fragmento usa **`./locales/…`** y **`./public/locales/…`** como si **`i18n`** estuviera al lado de esas carpetas. Si su archivo está bajo **`src/`** (típico), use **`../locales/…`** y **`../public/locales/…`** para que las importaciones resuelvan las mismas rutas que **`ui.stringsJson`**, **`uiLanguagesPath`** y **`ui.flatOutputDir`**.

Importa `i18n.js` antes de que React renderice (por ejemplo, en la parte superior de tu punto de entrada). Cuando el usuario cambie de idioma, llama a `await loadLocale(code)` y luego `i18n.changeLanguage(code)`.

Mantenga `localeLoaders` **alineado con la configuración** derivándolos de **`ui-languages.json`** con **`makeLocaleLoadersFromManifest`** (filtra **`SOURCE_LOCALE`** usando la misma normalización que **`makeLoadLocale`**). Después de añadir una configuración regional a **`targetLocales`** y ejecutar **`generate-ui-languages`**, el manifiesto se actualiza y sus cargadores lo rastrean sin necesidad de mantener un mapa codificado por separado. Si los paquetes JSON están bajo **`public/`** (Next.js típico), implemente cada cargador con **`fetch(\`/locales/${code}.json\`)`** en lugar de **`import()`** para que el navegador cargue JSON estático desde su ruta URL pública. Para CLIs de Node sin empaquetador, cargue archivos de configuración regional con **`readFileSync`** dentro de un pequeño ayudante **`makeFileLoader`** que devuelva el JSON analizado para cada código.

`SOURCE_LOCALE` se exporta para que cualquier otro archivo que lo necesite (por ejemplo, un selector de idioma) pueda importarlo directamente desde `'./i18n'`. Si estás migrando una configuración existente de i18next, reemplaza cualquier cadena codificada de forma rígida para el idioma fuente (por ejemplo, comprobaciones `'en-GB'` dispersas en los componentes) con importaciones de `SOURCE_LOCALE` desde tu archivo de inicialización de i18n.

Las importaciones nombradas (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionan igual si prefiere no usar la exportación predeterminada.

`aiI18n.defaultI18nInitOptions(sourceLocale)` (o `defaultI18nInitOptions(sourceLocale)` cuando se importa por nombre) devuelve las opciones estándar para configuraciones con clave como valor predeterminado:

- `parseMissingKeyHandler` devuelve la clave en sí, por lo que las cadenas no traducidas muestran el texto fuente.
- `nsSeparator: false` permite claves que contienen dos puntos.
- `interpolation.escapeValue: false` - seguro para desactivar: React escapa los valores por sí mismo, y la salida de Node.js/CLI no tiene HTML que escapar.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` es la conexión **recomendada** para proyectos ai-i18n-tools: aplica recorte de claves + retroceso de interpolación <code>{"{{var}}"}</code> para configuración regional de origen (mismo comportamiento que el **`wrapI18nWithKeyTrim`** de nivel inferior), opcionalmente combina claves con sufijos plurales **`translate-ui`** **`{sourceLocale}.json`** mediante **`addResourceBundle`**, y luego instala **`wrapT`** conscientes del plural desde su **`strings.json`**. Ese archivo agrupado debe ser el plano plural para su configuración regional de origen **configurada** — el mismo **`sourceLocale`** que en **`ai-i18n-tools.config.json`** y **`SOURCE_LOCALE`** en su inicialización i18n (véase el Paso 4 anterior). Omita **`sourcePluralFlatBundle`** solo durante la inicialización (incorpórelo una vez que **`translate-ui`** haya emitido **`{sourceLocale}.json`**). **`wrapI18nWithKeyTrim`** solo está **obsoleto** para código de aplicación — use **`setupKeyAsDefaultT`** en su lugar.

`makeLoadLocale(i18n, loaders, sourceLocale)` devuelve una función asíncrona `loadLocale(lang)` que importa dinámicamente el paquete JSON para una configuración regional y lo registra con i18next.

### Usando `t()` en el código fuente

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
- La clave debe ser una **cadena literal** - no variables ni expresiones como clave.
- No utilices literales de plantilla para la clave: <code>{'t(`Hola ${name}`)'}</code> no es extraíble.

### Interpolación

Utiliza la interpolación nativa del segundo argumento de i18next para los marcadores de posición <code>{"{{var}}"}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

El comando extract analiza el **segundo argumento** cuando es un objeto literal plano y lee banderas solo para herramientas como **`plurals: true`** y **`zeroDigit`** (véase **Plurales cardinales** más abajo). Para cadenas ordinarias, solo se usa la clave literal para el hash; las opciones de interpolación aún se pasan a i18next en tiempo de ejecución.

Si su proyecto usa una utilidad de interpolación personalizada (por ejemplo, llamar a `t('key')` y luego pasar el resultado por una función de plantilla como `interpolateTemplate(t('Hello {{name}}'), { name })`), **`setupKeyAsDefaultT`** (a través de **`wrapI18nWithKeyTrim`**) hace esto innecesario — aplica interpolación <code>{"{{var}}"}</code> incluso cuando la configuración regional de origen devuelve la clave cruda. Migre los sitios de llamada a `t('Hello {{name}}', { name })` y elimine la utilidad personalizada.

### Plurales cardinales (`plurals: true`)

Use el **mismo literal** que desee como texto predeterminado para desarrolladores, y pase **`plurals: true`** para que extract + `translate-ui` traten la llamada como un **grupo plural cardinal** (formas estilo JSON v4 de i18next `_zero` … `_other`).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- **`zeroDigit`** (opcional) — solo para herramientas; **no** leído por i18next. Cuando `true`, los mensajes prefieren un **`0`** árabe literal en la cadena `_zero` para cada configuración regional donde exista esa forma; cuando `false` u omitido, se usa la redacción natural del cero. Elimine estas claves antes de llamar a `i18next.t` (véase `wrapT` más abajo).

**Validación:** Si el mensaje contiene **dos o más** marcadores de posición `{{…}}` distintos, **uno de ellos debe ser `{{count}}`** (el eje plural). De lo contrario, `extract` **falla** con un mensaje claro de archivo/línea.

**Dos conteos independientes** (por ejemplo, secciones y páginas) no pueden compartir un mismo mensaje plural — use **dos** llamadas a `t()` (cada una con `plurals: true` y su propio `count`) y concaténelas en la interfaz.

`strings.json` **:** Los grupos plurales usan **una fila por hash** con `"plural": true`, el literal original en **`source`** y **`translated[locale]`** como un objeto que asigna categorías cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) a cadenas para esa configuración regional.

**JSON plano de configuración regional:** Las filas no plurales permanecen como **frase fuente → traducción**. Las filas plurales se emiten como **`<groupId>_original`** (igual a `source`, para referencia) y **`<groupId>_<form>`** para cada sufijo, de modo que i18next resuelva los plurales de forma nativa. **`translate-ui`** también escribe **`{sourceLocale}.json`** que contiene **únicamente** claves planas plurales (cargue este paquete para el idioma fuente para que las claves con sufijo se resuelvan; las cadenas simples siguen usando la clave como valor por defecto). Para cada configuración regional de destino, las claves de sufijo emitidas coinciden con **`Intl.PluralRules`** para esa configuración regional (`requiredCldrPluralForms`): si `strings.json` omite una categoría porque coincidía con otra tras la compactación (por ejemplo, en árabe **`many`** es igual que **`other`**), **`translate-ui`** aún así escribe todos los sufijos necesarios en el archivo plano copiándolos desde una cadena alternativa de respaldo, para que la búsqueda en tiempo de ejecución nunca falte una clave.

Tiempo de ejecución (`ai-i18n-tools/runtime` **):** Llame a **`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })`** — ejecuta **`wrapI18nWithKeyTrim`**, registra el paquete plural opcional **`translate-ui`** `{sourceLocale}.json`, y luego **`wrapT`** usando **`buildPluralIndexFromStringsJson(stringsJson)`**. `wrapT` elimina `plurals` / `zeroDigit`, reescribe la clave al ID del grupo cuando sea necesario y reenvía **`count`** (opcional: si hay un único marcador de posición no `{{count}}`, `count` se copia de esa opción numérica).

**Entornos antiguos:** `Intl.PluralRules` es necesario para las herramientas y para un comportamiento consistente; use polyfill si su objetivo son navegadores muy antiguos.

**No incluido en v1:** plurales ordinales (`_ordinal_*`, `ordinal: true`), plurales de intervalo, tuberías exclusivas de ICU.

### Interfaz de cambio de idioma

Utiliza el manifiesto `ui-languages.json` para construir un selector de idioma. `ai-i18n-tools` exporta dos ayudantes de visualización:

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

`getUILanguageLabelNative(lang)` - muestra `englishName / label` (sin llamada a `t()` en cada fila). Adecuado para menús de cabecera donde se desea que el nombre nativo sea visible.

El manifiesto `ui-languages.json` es un array JSON de entradas <code>{"{ code, label, englishName, direction }"}</code> (`direction` es `"ltr"` o `"rtl"`). Ejemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

El manifiesto es generado por `generate-ui-languages` a partir de `sourceLocale` + `targetLocales` y el catálogo maestro agrupado. Se escribe en `ui.flatOutputDir`. Si cambia cualquiera de las configuraciones regionales en la configuración, ejecute `generate-ui-languages` para actualizar el archivo `ui-languages.json`.

### Idiomas RTL

`ai-i18n-tools` exporta `getTextDirection(lng)` y `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` establece `document.documentElement.dir` (navegador) o es una operación no efectiva (Node.js). Pasa un argumento opcional `element` para dirigir un elemento específico.

Para cadenas que pueden contener flechas `→`, inviértelas para diseños RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Flujo de trabajo 2 - Traducción de documentos

Diseñado para documentación en markdown, sitios Docusaurus y archivos de etiquetas JSON. Los recursos SVG independientes se traducen mediante [`translate-svg`](#cli-reference) cuando `features.translateSVG` está habilitado y se establece el bloque `svg` de nivel superior — no mediante `documentations[].contentPaths`.

### Paso 1: Inicializar

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edita el `ai-i18n-tools.config.json` generado:

- `sourceLocale` - idioma fuente (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales` - array de códigos de configuración regional BCP-47 (por ejemplo, `["de", "fr", "es"]`).
- `cacheDir` - directorio compartido de caché SQLite para todas las canalizaciones de documentación (y directorio de registro predeterminado para `--write-logs`).
- `documentations` - array de bloques de documentación. Cada bloque tiene `description`, `contentPaths`, `outputDir` opcionales, `jsonSource` opcional, `markdownOutput`, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - nota corta opcional para los mantenedores (qué cubre este bloque). Cuando se establece, aparece en el encabezado `translate-docs` (`🌐 …: translating …`) y en los encabezados de sección `status`.
- `documentations[].contentPaths` - directorios o archivos fuente en markdown/MDX (ver también `documentations[].jsonSource` para etiquetas JSON).
- `documentations[].outputDir` - raíz de salida traducida para ese bloque.
- `documentations[].markdownOutput.style` - `"nested"` (predeterminado), `"docusaurus"` o `"flat"` (ver [Diseños de salida](#output-layouts)).

### Paso 2: Traducir documentos

```bash
npx ai-i18n-tools translate-docs
```

Esto traduce todos los archivos en cada bloque de `documentaciones` en `contentPaths` a todos los locales de documentación efectivos (unión de los `targetLocales` de cada bloque cuando se establece, de lo contrario, los `targetLocales` raíz). Los segmentos ya traducidos se sirven desde la caché de SQLite; solo se envían segmentos nuevos o cambiados al LLM.

Para traducir un solo locale:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para comprobar qué necesita traducción:

```bash
npx ai-i18n-tools status
```

#### Comportamiento de la caché y banderas de `translate-docs`

La CLI mantiene **seguimiento de archivos** en SQLite (hash de origen por archivo × locale) y filas de **segmentos** (hash × locale por fragmento traducible). Una ejecución normal omite un archivo por completo cuando el hash rastreado coincide con la fuente actual **y** el archivo de salida ya existe; de lo contrario, procesa el archivo y utiliza la caché de segmentos para que el texto sin cambios no llame a la API.

| Bandera                  | Efecto                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(por defecto)*          | Omite archivos sin cambios cuando el seguimiento coincide con la salida en disco; usa la caché de segmentos para el resto.                                                                                                             |
| `-l, --locale <codes>`   | Ubicaciones regionales de destino separadas por comas (los valores predeterminados siguen `documentation.targetLocales` / `targetLocales` cuando se omiten).                                                                                           |
| `-p, --path` / `-f, --file` | Traduce únicamente markdown/JSON bajo esta ruta (relativa al proyecto o absoluta); `--file` es un alias para `--path`.                                                                                     |
| `--dry-run`              | Sin escrituras de archivos ni llamadas a la API.                                                                                                                                                                       |
| `--type <kind>`          | Restringe a `markdown` o `json` (de lo contrario ambos cuando están habilitados en la configuración).                                                                                                                              |
| `--json-only` / `--no-json` | Traduce únicamente archivos JSON de etiquetas, o salta JSON y traduce solo markdown.                                                                                                                         |
| `-j, --concurrency <n>`  | Número máximo de ubicaciones regionales en paralelo (por defecto desde la configuración o valor predeterminado integrado en CLI).                                                                                                                             |
| `-b, --batch-concurrency <n>` | Número máximo de llamadas API por lote por archivo (documentos; por defecto desde configuración o CLI).                                                                                                                          |
| `--emphasis-placeholders` | Enmascara los marcadores de énfasis en markdown como marcadores de posición antes de la traducción (opcional; por defecto desactivado).                                                                                                         |
| `--debug-failed`         | Escribe registros detallados `FAILED-TRANSLATION` bajo `cacheDir` cuando falla la validación.                                                                                                                       |
| `--force-update`         | Vuelve a procesar cada archivo coincidente (extrae, reensambla, escribe salidas) incluso cuando el seguimiento de archivos lo omitiría. **La caché de segmentos aún se aplica** - los segmentos sin cambios no se envían al LLM.                   |
| `--force`                | Borra el seguimiento de archivos para cada archivo procesado y **no lee** la caché de segmentos para la traducción mediante API (retraducción completa). Los nuevos resultados aún se **escriben** en la caché de segmentos.                 |
| `--stats`                | Muestra los conteos de segmentos, los conteos de archivos rastreados y los totales de segmentos por ubicación regional, luego finaliza.                                                                                                                   |
| `--clear-cache [locale]` | Elimina las traducciones en caché (y el seguimiento de archivos): todas las ubicaciones regionales, o una sola ubicación regional, luego finaliza.                                                                                                            |
| `--prompt-format <mode>` | Cómo se envía cada **lote** de segmentos al modelo y cómo se analiza (`xml`, `json-array`, o `json-object`). Por defecto **`json-array`**. No cambia la extracción, marcadores de posición, validación, caché ni el comportamiento de respaldo — véase [Formato del prompt por lotes](#batch-prompt-format). |

No puedes combinar `--force` con `--force-update` (son mutuamente excluyentes).

#### Formato del lote de indicaciones

`translate-docs` envía segmentos traducibles a OpenRouter en **lotes** (agrupados por `batchSize` / `maxBatchChars`). La bandera **`--prompt-format`** solo cambia el **formato de transmisión** de ese lote; la división de segmentos, los tokens de `PlaceholderHandler`, las comprobaciones del AST de markdown, las claves de caché SQLite y la recuperación por segmento cuando falla el análisis del lote permanecen sin cambios.

| Modo | Mensaje del usuario | Respuesta del modelo |
| ---- | ------------ | ----------- |
| **`xml`** | Pseudo-XML: un `<seg id="N">…</seg>` por segmento (con escape XML). | Solo bloques `<t id="N">…</t>`, uno por índice de segmento. |
| **`json-array`** (por defecto) | Una matriz JSON de cadenas, una entrada por segmento en orden. | Una matriz JSON de la **misma longitud** (mismo orden). |
| **`json-object`** | Un objeto JSON `{"0":"…","1":"…",…}` indexado por número de segmento. | Un objeto JSON con las **mismas claves** y valores traducidos. |

El encabezado de ejecución también imprime `Batch prompt format: …` para que pueda confirmar el modo activo. Los archivos de etiquetas JSON (`jsonSource`) y los lotes SVG independientes usan la misma configuración cuando esos pasos se ejecutan como parte de `translate-docs` (o la fase de documentación de `sync` — `sync` no expone esta bandera; por defecto es **`json-array`**).

**Dedupe de segmentos y rutas en SQLite**

- Las filas de segmentos están indexadas globalmente por `(source_hash, locale)` (hash = contenido normalizado). Un texto idéntico en dos archivos comparte una sola fila; `translations.filepath` es metadato (último escritor), no una entrada de caché adicional por archivo.
- `file_tracking.filepath` utiliza claves con espacio de nombres: `doc-block:{index}:{relPath}` por bloque `documentations` (`relPath` es una ruta posix relativa a la raíz del proyecto: rutas markdown tal como se recopilan; **los archivos de etiquetas JSON usan la ruta relativa al directorio actual del proceso (cwd) del archivo fuente**, por ejemplo, `docs-site/i18n/en/code.json`, para que la limpieza pueda resolver el archivo real), y `svg-assets:{relPath}` para activos SVG independientes bajo `translate-svg`.
- `translations.filepath` almacena rutas posix relativas al directorio actual (cwd) para segmentos markdown, JSON y SVG (SVG usa la misma forma de ruta que otros activos; el prefijo `svg-assets:…` está **solo** en `file_tracking`).
- Después de una ejecución, `last_hit_at` se borra solo para las filas de segmentos **en el mismo ámbito de traducción** (respetando `--path` y los tipos habilitados) que no fueron alcanzados, por lo que una ejecución filtrada o solo de documentos no marca como obsoletos archivos no relacionados.

### Diseños de salida

`"nested"` (por defecto cuando se omite) — refleja el árbol de origen bajo `{outputDir}/{locale}/` (por ejemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — coloca los archivos que están bajo `docsRoot` en `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, coincidiendo con el diseño habitual de i18n de Docusaurus. Establezca `documentations[].markdownOutput.docsRoot` a la raíz de origen de sus documentos (por ejemplo, `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - coloca los archivos traducidos junto al origen con un sufijo de configuración regional, o en un subdirectorio. Los enlaces relativos entre páginas se reescriben automáticamente.

```
docs/guide.md → i18n/guide.de.md
```

Puedes sobrescribir rutas completamente con `documentations[].markdownOutput.pathTemplate`. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Flujo de trabajo combinado (UI + Documentos)

Habilita todas las funciones en una sola configuración para ejecutar ambos flujos de trabajo juntos:

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

`glossary.uiGlossary` apunta la traducción de documentos al mismo catálogo `strings.json` que la UI para que la terminología se mantenga consistente; `glossary.userGlossary` añade sobrescrituras CSV para términos de producto.

Ejecuta `npx ai-i18n-tools sync` para ejecutar una canalización: **extraer** cadenas de interfaz de usuario (si `features.extractUIStrings`), **traducir** cadenas de interfaz de usuario (si `features.translateUIStrings`), **traducir recursos SVG independientes** (si `features.translateSVG` y un bloque `svg` están establecidos), y luego **traducir documentación** (cada bloque `documentations`: markdown/JSON según esté configurado). Omite partes con `--no-ui`, `--no-svg` o `--no-docs`. El paso de documentación acepta `--dry-run`, `-p` / `--path`, `--force` y `--force-update` (los dos últimos solo se aplican cuando se ejecuta la traducción de documentación; se ignoran si pasas `--no-docs`).

Usa `documentations[].targetLocales` en un bloque para traducir los archivos de ese bloque a un **subconjunto más pequeño** que la UI (los locales de documentación efectivos son la **unión** entre bloques):

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

### Flujo de trabajo de documentación mixta (Docusaurus + plano)

Puede combinar varias tuberías de documentación en la misma configuración añadiendo más de una entrada en `documentations`. Esta es una configuración común cuando un proyecto tiene un sitio Docusaurus además de archivos markdown de nivel raíz (por ejemplo, un archivo Léame del repositorio) que deben traducirse con salida plana.

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
      "description": "Docusaurus docs and JSON labels",
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
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

Cómo se ejecuta esto con `npx ai-i18n-tools sync`:

- Las cadenas de interfaz se extraen/traducen de `src/` a `public/locales/`.
- El primer bloque de documentación traduce markdown y etiquetas JSON al diseño `i18n/<locale>/...` de Docusaurus.
- El segundo bloque de documentación traduce `README.md` a archivos planos con sufijo de configuración regional bajo `translated-docs/`.
- Todos los bloques de documentación comparten `cacheDir`, por lo que los segmentos sin cambios se reutilizan entre ejecuciones para reducir llamadas a la API y costos.

---

## Referencia de configuración

### `sourceLocale`

Código BCP-47 para el idioma fuente (por ejemplo, `"en-GB"`, `"en"`, `"pt-BR"`). No se genera un archivo de traducción para esta localidad - la cadena clave en sí es el texto fuente.

**Debe coincidir** con `SOURCE_LOCALE` exportado desde tu archivo de configuración i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales`

Matriz de códigos de configuración regional BCP-47 a los que traducir (por ejemplo, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` es la lista principal de configuraciones regionales para la traducción de la interfaz de usuario y la lista predeterminada de configuraciones regionales para bloques de documentación. Use `generate-ui-languages` para construir el manifiesto `ui-languages.json` a partir de `sourceLocale` + `targetLocales`.

### `uiLanguagesPath` (opcional)

Ruta al manifiesto `ui-languages.json` utilizado para nombres mostrados, filtrado por configuración regional y postprocesamiento de listas de idiomas. Si se omite, la CLI busca el manifiesto en `ui.flatOutputDir/ui-languages.json`.

Usa esto cuando:

- El manifiesto está fuera de `ui.flatOutputDir` y debe indicar explícitamente a la CLI dónde está.
- Desea que `markdownOutput.postProcessing.languageListBlock` genere etiquetas de configuración regional a partir del manifiesto.
- `extract` debería fusionar entradas `englishName` del manifiesto en `strings.json` (requiere `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

### `concurrency` (opcional)

Máximo **localidades objetivo** traducidas al mismo tiempo (`translate-ui`, `translate-docs`, `translate-svg`, y los pasos correspondientes dentro de `sync`). Si se omite, la CLI utiliza **4** para la traducción de UI y **3** para la traducción de documentación (valores predeterminados integrados). Sobrescribe por ejecución con `-j` / `--concurrency`.

### `batchConcurrency` (opcional)

**translate-docs** y **translate-svg** (y el paso de documentación de `sync`): solicitudes máximas de **batch** paralelas de OpenRouter por archivo (cada batch puede contener muchos segmentos). Por defecto **4** cuando se omite. Ignorado por `translate-ui`. Sobrescribir con `-b` / `--batch-concurrency`. En `sync`, `-b` se aplica solo al paso de traducción de documentación.

### `batchSize` / `maxBatchChars` (opcional)

Agrupación de segmentos para la traducción de documentos: cuántos segmentos por solicitud de API y un límite de caracteres. Por defecto: **20** segmentos, **4096** caracteres (cuando se omite).

### `openrouter`

| Campo               | Descripción                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | URL base de la API de OpenRouter. Por defecto: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Lista ordenada preferida de IDs de modelos. Se intenta primero el primero; las entradas posteriores son alternativas en caso de error. Para `translate-ui` solo, también puede establecer `ui.preferredModel` para probar un modelo antes de esta lista (véase `ui`). |
| `defaultModel`      | Modelo principal único heredado. Se usa solo cuando `translationModels` no está establecido o está vacío.       |
| `fallbackModel`     | Modelo de respaldo único heredado. Se usa tras `defaultModel` cuando `translationModels` no está establecido o está vacío. |
| `maxTokens`         | Número máximo de tokens de finalización por solicitud. Por defecto: `8192`.                                      |
| `temperature`       | Temperatura de muestreo. Por defecto: `0.2` **.                                                    |**Por qué usar múltiples modelos:** Diferentes proveedores y modelos tienen costos variables y ofrecen distintos niveles de calidad según los idiomas y ubicaciones geográficas. Configure **`openrouter.translationModels` como una cadena de reserva ordenada** (en lugar de un solo modelo) para que la CLI pueda intentar con el siguiente modelo si falla una solicitud.

Considere la lista siguiente como una **base** que puede ampliar: si la traducción para una ubicación geográfica específica es deficiente o fallida, investigue qué modelos admiten eficazmente ese idioma o escritura (consulte recursos en línea o la documentación de su proveedor) y agregue esos ID de OpenRouter como alternativas adicionales.

Esta lista fue **probada para una amplia cobertura de ubicaciones geográficas** (por ejemplo, en el proyecto Transrewrt traduciendo **36** ubicaciones objetivo) en **abril de 2026; sirve como valor predeterminado práctico, pero no se garantiza que funcione bien en todas las ubicaciones.

Ejemplo `translationModels` (mismos valores por defecto que `npx ai-i18n-tools init`):

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-5.3-codex",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash-preview"
]
```

Establece `OPENROUTER_API_KEY` en tu entorno o archivo `.env`.

### `features`

| Campo                | Flujo de trabajo | Descripción                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | Escanear el código fuente en busca de `t("…")` / `i18n.t("…")`, fusionar descripción opcional `package.json` y (si está habilitado) valores `ui-languages.json` `englishName` en `strings.json`. |
| `translateUIStrings` | 1        | Traducir entradas `strings.json` y escribir archivos JSON por configuración regional. |
| `translateMarkdown`  | 2        | Traducir archivos `.md` / `.mdx`.                                   |
| `translateJSON`      | 2        | Traducir archivos JSON de etiquetas de Docusaurus.                            |
| `translateSVG`       | 2        | Traducir recursos `.svg` independientes (requiere el bloque `svg` **de nivel superior). |

Traduce recursos SVG**independientes** con `translate-svg` cuando `features.translateSVG` es verdadero y se configura un bloque `svg` de nivel superior. El comando `sync` ejecuta ese paso cuando ambos están establecidos (a menos que se use `--no-svg`).

### `ui`

| Campo                       | Descripción                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Directorios (relativos al directorio actual) escaneados en busca de llamadas a `t("…")`.               |
| `stringsJson`               | Ruta al archivo de catálogo maestro. Actualizado por `extract`.                  |
| `flatOutputDir`             | Directorio donde se escriben los archivos JSON por configuración regional (`de.json`, etc.).    |
| `preferredModel`            | Opcional. ID de modelo OpenRouter probado primero solo para `translate-ui`; luego `openrouter.translationModels` (o modelos antiguos) en orden, sin duplicar este ID. |
| `reactExtractor.funcNames`  | Nombres adicionales de funciones para escanear (por defecto: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensiones de archivo a incluir (por defecto: `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Cuando es `true` (por defecto), `extract` también incluye `package.json` `description` como cadena de interfaz de usuario cuando está presente. |
| `reactExtractor.packageJsonPath` | Ruta personalizada al archivo `package.json` usado para esa extracción opcional de descripción. |
| `reactExtractor.includeUiLanguageEnglishNames` | Cuando es `true` (por defecto `false`), `extract` también agrega cada `englishName` del manifiesto en `uiLanguagesPath` a `strings.json` cuando no esté ya presente del escaneo del código fuente (mismas claves hash). Requiere `uiLanguagesPath` apuntando a un `ui-languages.json` válido. |

### `cacheDir`

| Campo      | Descripción                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Directorio de caché SQLite (compartido por todos los bloques `documentations`). Reutilizable entre ejecuciones. Si está migrando desde una caché personalizada de traducción de documentos, archívela o elimínela — `cacheDir` crea su propia base de datos SQLite y no es compatible con otros esquemas. |

Mejor práctica para exclusiones en el control de versiones:

- Excluya el contenido de la carpeta de caché de traducción (por ejemplo, mediante `.gitignore` o `.git/info/exclude`) para evitar confirmar artefactos de caché transitorios.
- Mantenga `cache.db` disponible (no lo elimine habitualmente), porque preservar la caché SQLite evita volver a traducir segmentos sin cambios, lo que ahorra tiempo de ejecución y costos de API al cambiar o actualizar software que usa `ai-i18n-tools`.

Ejemplo:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

### `documentations`

Array de bloques de documentación del pipeline. `translate-docs` y la fase de documentación del proceso `sync` **cada uno procesa los bloques en orden.

| Campo                                        | Descripción                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | Nota opcional legible para humanos sobre este bloque (no se utiliza para traducción). Se antepone en el encabezado `translate-docs` `🌐` cuando está configurado; también se muestra en los encabezados de sección `status`.                                                     |
| `contentPaths`                               | Fuentes Markdown/MDX a traducir (`translate-docs` escanea estos para `.md` / `.mdx`). Las etiquetas JSON provienen de `jsonSource` en el mismo bloque.                                                                                  |
| `outputDir`                                  | Directorio raíz para la salida traducida de este bloque.                                                                                                                                                                      |
| `sourceFiles`                                | Alias opcional que se combina en `contentPaths` al cargar.                                                                                                                                                                        |
| `targetLocales`                              | Subconjunto opcional de configuraciones regionales solo para este bloque (de lo contrario, usa la raíz `targetLocales`). Las configuraciones regionales efectivas para la documentación son la unión entre bloques.                                                                             |
| `jsonSource`                                 | Directorio fuente para los archivos JSON de etiquetas de Docusaurus para este bloque (por ejemplo, `"i18n/en"`).                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (predeterminado), `"docusaurus"` o `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Raíz de documentos fuente para el diseño de Docusaurus (por ejemplo, `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Ruta personalizada de salida en formato markdown. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | Ruta de salida personalizada para archivos JSON de etiquetas. Admite los mismos marcadores de posición que `pathTemplate`.                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | Para el estilo `flat`, mantener los subdirectorios fuente para que los archivos con el mismo nombre base no entren en conflicto.                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | Reescribir enlaces relativos después de la traducción (activado automáticamente para el estilo `flat`).                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | Raíz del repositorio utilizada al calcular prefijos de reescritura de enlaces planos. Por lo general, déjelo como `"."` a menos que sus documentos traducidos estén bajo una raíz de proyecto diferente. |
| `markdownOutput.postProcessing` **| Transformaciones opcionales en el**cuerpo del markdown traducido (el front matter YAML se conserva). Se ejecuta después del reensamblaje de segmentos y la reescritura de enlaces planos, y antes de `addFrontmatter`. |
| `markdownOutput.postProcessing.regexAdjustments` | Lista ordenada de `{ "description"?, "search", "replace" }`. `search` es un patrón regex (cadena simple usa la bandera `g`, o `/pattern/flags`). `replace` admite marcadores de posición como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`. |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — el traductor busca la primera línea que contenga `start` y la línea `end` coincidente, luego reemplaza ese fragmento con un selector de idioma canónico. Los enlaces se construyen con rutas relativas al archivo traducido; las etiquetas provienen de `uiLanguagesPath` / `ui-languages.json` cuando están configuradas, de lo contrario de `localeDisplayNames` y los códigos de configuración regional. |
| `addFrontmatter`                  | Cuando `true` (predeterminado si se omite), los archivos markdown traducidos incluyen claves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, y cuando al menos un segmento tiene metadatos del modelo, `translation_models` (lista ordenada de identificadores de modelos OpenRouter utilizados). Establezca en `false` para omitir. |

Ejemplo (pipeline README plano — rutas de captura de pantalla + envoltura de lista de idiomas opcional):

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
      "separator": " · "
    }
  }
}
```

### `svg` **(opcional)

Rutas y disposición de nivel superior para recursos SVG independientes. La traducción se ejecuta solo cuando**`features.translateSVG` es verdadero (mediante `translate-svg` o la etapa SVG de `sync`).

| Campo                       | Descripción |
| --------------------------- | ----------- |
| `sourcePath`                | Un directorio o un array de directorios escaneados recursivamente en busca de archivos `.svg`. |
| `outputDir`                 | Directorio raíz para la salida SVG traducida. |
| `style`                     | `"plano"` o `"nidificado"` cuando `pathTemplate` no está establecido. |
| `pathTemplate`              | Ruta de salida SVG personalizada. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texto traducido en minúsculas en el reensamblaje de SVG. Útil para diseños que dependen de etiquetas en minúsculas. |

### `glossary`

| Campo          | Descripción                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Ruta a `strings.json` - crea automáticamente un glosario a partir de las traducciones existentes.                                                                                                                 |
| `userGlossary` | Ruta a un archivo CSV con columnas `Original language string` (o `en`), `locale`, `Translation` - una fila por término fuente y configuración regional de destino (`locale` puede ser `*` para todos los destinos).

La clave heredada `uiGlossaryFromStringsJson` todavía se acepta y se mapea a `uiGlossary` al cargar la configuración.

Generar un CSV de glosario vacío:

```bash
npx ai-i18n-tools glossary-generate
```

---

## Referencia de CLI

| Comando | Descripción |
|--------|------------|
| `version` | Muestra la versión de la CLI y la marca de tiempo de compilación (la misma información que `-V` / `--version` en el programa raíz). |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Escribe un archivo de configuración inicial (incluye `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` y `documentations[].addFrontmatter`). `--with-translate-ignore` crea un `.translate-ignore` inicial. |
| `extract` | Actualiza `strings.json` a partir de literales `t("…")` / `i18n.t("…")`, descripción opcional `package.json` y entradas opcionales `englishName` en el manifiesto (ver `ui.reactExtractor`). Requiere `features.extractUIStrings`. |
| `generate-ui-languages [--master <path>] [--dry-run]` | Escribe `ui-languages.json` en `ui.flatOutputDir` (o en `uiLanguagesPath` si está establecido) usando `sourceLocale` + `targetLocales` y el `data/ui-languages-complete.json` incluido (o `--master`). Advierte y emite marcadores de posición `TODO` para idiomas que faltan en el archivo maestro. Si ya tiene un manifiesto con valores personalizados de `label` o `englishName`, estos serán reemplazados por los valores predeterminados del catálogo maestro; revise y ajuste el archivo generado después. |
| `translate-docs …` | Traduce archivos markdown/MDX y JSON para cada bloque `documentations` (`contentPaths`, `jsonSource` opcional). `-j`: número máximo de idiomas en paralelo; `-b`: número máximo de llamadas paralelas a la API por archivo. `--prompt-format`: formato de envío por lotes (`xml` \| `json-array` \| `json-object`). Ver [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags) y [Formato de solicitud por lotes](#batch-prompt-format). |
| `translate-svg …` | Traduce solo recursos SVG independientes configurados en `config.svg` (separados de la documentación). Requiere `features.translateSVG`. Misma lógica de caché que la documentación; admite `--no-cache` para omitir lecturas/escrituras de SQLite en esa ejecución. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`. |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]` | Traduce solo cadenas de interfaz. `--force`: vuelve a traducir todas las entradas por idioma (ignora traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a la API. `-j`: número máximo de idiomas en paralelo. Requiere `features.translateUIStrings`. |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]` **| Ejecuta primero**`extract`** (requiere **`features.extractUIStrings`**) para que **`strings.json`** coincida con el origen, luego realiza una revisión con LLM de las cadenas de interfaz en el **idioma fuente** (ortografía, gramática). Las **sugerencias de terminología** provienen únicamente del archivo CSV **`glossary.userGlossary`** (mismo alcance que **`translate-ui` — no de `strings.json` / `uiGlossary`, para no reforzar texto incorrecto como glosario). Usa OpenRouter (`OPENROUTER_API_KEY` **). Solo orientativo (sale con código**0** al finalizar). Escribe **`lint-source-results_<timestamp>.log`** en **`cacheDir`** como informe **legible por humanos** (resumen, problemas y filas **OK** por cadena); la terminal muestra solo recuentos y problemas (sin líneas **`[ok]`** por cadena). Imprime el nombre del archivo de registro en la última línea. **`--json`**: informe JSON completo y legible por máquina solo en stdout (el archivo de registro sigue siendo legible por humanos). **`--dry-run`**: aún ejecuta **`extract`**, pero solo imprime el plan por lotes (sin llamadas a la API). **`--chunk`**: número de cadenas por lote de API (predeterminado **50). `-j` **: número máximo de lotes en paralelo (predeterminado**`concurrency`**). Con **`--json`**, la salida estilo humano va a stderr. Los enlaces usan **`path:line`** como el botón “enlace” de las cadenas de interfaz **`editor`. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exporta `strings.json` a XLIFF 2.0 (una `.xliff` por idioma de destino). `-o` / `--output-dir`: directorio de salida (predeterminado: misma carpeta que el catálogo). `--untranslated-only`: solo unidades sin traducción para ese idioma. Solo lectura; sin API. |
| `sync …` | Extrae (si está habilitado), luego traducción de interfaz, luego `translate-svg` cuando están establecidos `features.translateSVG` y `config.svg`, luego traducción de documentación — a menos que se omita con `--no-ui`, `--no-svg` o `--no-docs`. Banderas compartidas: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (solo agrupación de documentación), `--force` / `--force-update` (solo documentación; mutuamente excluyentes cuando se ejecuta la documentación). La fase de documentación también transmite `--emphasis-placeholders` y `--debug-failed` (mismo significado que `translate-docs`). `--prompt-format` no es una bandera `sync`; el paso de documentación usa el valor predeterminado integrado (`json-array`). |
| `status [--max-columns <n>]` | Cuando `features.translateUIStrings` está activado, muestra la cobertura de interfaz por idioma (`Translated` / `Missing` / `Total`). Luego muestra el estado de traducción de markdown por archivo × idioma (sin filtro `--locale`; los idiomas provienen de la configuración). Las listas grandes de idiomas se dividen en tablas repetidas de hasta `n` **columnas de idiomas (predeterminado**9) para mantener líneas estrechas en la terminal. |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]` | Ejecuta primero `sync --force-update` (extraer, interfaz, SVG, documentación), luego elimina filas de segmentos obsoletos (`last_hit_at` nulo / ruta de archivo vacía); elimina filas `file_tracking` cuya ruta de origen resuelta no existe en el disco; elimina traducciones cuyos metadatos `filepath` apuntan a un archivo faltante. Registra tres recuentos (obsoletos, `file_tracking` huérfanos, traducciones huérfanas). Crea una copia de seguridad de SQLite con marca de tiempo en el directorio de caché, a menos que se use `--no-backup`. |
| `editor [-p <port>] [--no-open]` | Inicia un editor web local para la caché, `strings.json` y el archivo CSV de glosario. `--no-open` **: no abre automáticamente el navegador predeterminado.<br><br>**Nota: Si edita una entrada en el editor de caché, debe ejecutar un `sync --force-update` para reescribir los archivos de salida con la entrada de caché actualizada. Además, si el texto fuente cambia más adelante, la edición manual se perderá porque se genera una nueva clave de caché. |
| `glossary-generate [-o <path>]` | Escribe una plantilla `glossary-user.csv` vacía. `-o`: sobrescribe la ruta de salida (predeterminado: `glossary.userGlossary` de la configuración, o `glossary-user.csv`). |

Todos los comandos aceptan `-c <path>` para especificar un archivo de configuración no predeterminado, `-v` para una salida detallada y `-w` / `--write-logs [path]` para duplicar la salida de la consola en un archivo de registro (ruta predeterminada: dentro de `cacheDir` raíz). El programa principal también admite `-V` / `--version` y `-h` / `--help`; `ai-i18n-tools help [command]` muestra la misma ayuda por comando que `ai-i18n-tools <command> --help`.

---

## Variables de entorno

| Variable               | Descripción                                               |
| ---------------------- | --------------------------------------------------------- |
| `OPENROUTER_API_KEY` **|**Requerido.** Tu clave API de OpenRouter.               |
| `OPENROUTER_BASE_URL`  | Sobrescribir la URL base de la API.                      |
| `I18N_SOURCE_LOCALE`   | Sobrescribir `sourceLocale` en tiempo de ejecución.      |
| `I18N_TARGET_LOCALES`  | Códigos de locales separados por comas para sobrescribir `targetLocales`. |
| `I18N_LOG_LEVEL`       | Nivel del registrador (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Cuando `1`, deshabilitar colores ANSI en la salida del registro. |
| `I18N_LOG_SESSION_MAX` | Máximas líneas mantenidas por sesión de registro (predeterminado `5000`). |
