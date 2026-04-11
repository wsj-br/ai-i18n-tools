---
translation_last_updated: '2026-04-11T01:50:07.478Z'
source_file_mtime: '2026-04-11T01:49:54.972Z'
source_file_hash: 42cdce1d92b5dfdb22af93d450a8a9ca909c0ec4aa06ddfe5cf89bde8acd698b
translation_language: es
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools: Introducción

`ai-i18n-tools` proporciona dos flujos de trabajo independientes y componibles:

- **Flujo de trabajo 1 - Traducción de interfaz**: extrae llamadas `t("…")` de cualquier fuente JS/TS, las traduce mediante OpenRouter y genera archivos JSON planos por idioma listos para i18next.
- **Flujo de trabajo 2 - Traducción de documentos**: traduce archivos markdown (MDX), archivos JSON de etiquetas de Docusaurus y archivos SVG a cualquier número de idiomas, con caché inteligente.

Ambos flujos de trabajo utilizan OpenRouter (cualquier LLM compatible) y comparten un único archivo de configuración.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenidos**

- [Instalación](#installation)
- [Inicio rápido](#quick-start)
- [Flujo de trabajo 1 - Traducción de interfaz](#workflow-1---ui-translation)
  - [Paso 1: Inicializar](#step-1-initialize)
  - [Paso 2: Extraer cadenas](#step-2-extract-strings)
  - [Paso 3: Traducir cadenas de interfaz](#step-3-translate-ui-strings)
  - [Paso 4: Conectar i18next en tiempo de ejecución](#step-4-wire-i18next-at-runtime)
  - [Usar `t()` en el código fuente](#using-t-in-source-code)
  - [Interpolación](#interpolation)
  - [Interfaz de cambio de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Flujo de trabajo 2 - Traducción de documentos](#workflow-2---document-translation)
  - [Paso 1: Inicializar](#step-1-initialize-1)
  - [Paso 2: Traducir documentos](#step-2-translate-documents)
    - [Comportamiento de caché y banderas de `translate-docs`](#cache-behavior-and-translate-docs-flags)
  - [Diseños de salida](#output-layouts)
- [Flujo combinado (interfaz + documentos)](#combined-workflow-ui--docs)
- [Referencia de configuración](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`documentation`](#documentation)
  - [`glossary`](#glossary)
- [Referencia CLI](#cli-reference)
- [Variables de entorno](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Instalación {#installation}

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Establezca su clave de API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O cree un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Inicio rápido {#quick-start}

La plantilla `init` predeterminada (`ui-markdown`) habilita únicamente la extracción/traducción de **interfaz**. La plantilla `ui-docusaurus` habilita la traducción de **documentos** (`translate-docs`). Use `sync` cuando desee extracción + interfaz + documentos (y SVG independiente opcional cuando `svg` esté configurado) en una sola invocación.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## Flujo de trabajo 1 - Traducción de interfaz {#workflow-1---ui-translation}

Diseñado para cualquier proyecto JS/TS que use i18next: aplicaciones React, Next.js (componentes cliente y servidor), servicios Node.js, herramientas CLI.

### Paso 1: Inicializar {#step-1-initialize}

```bash
npx ai-i18n-tools init
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown`. Edítelo para configurar:

- `sourceLocale` - código BCP-47 de su idioma fuente (por ejemplo, `"en-GB"`). **Debe coincidir** con `SOURCE_LOCALE` exportado desde su archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - ruta a su manifiesto `ui-languages.json` O un array de códigos BCP-47.
- `ui.sourceRoots` - directorios a escanear para llamadas `t("…")` (por ejemplo, `["src/"]`).
- `ui.stringsJson` - dónde escribir el catálogo maestro (por ejemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - dónde escribir `de.json`, `pt-BR.json`, etc. (por ejemplo, `"src/locales/"`).

### Paso 2: Extraer cadenas {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Escanea todos los archivos JS/TS bajo `ui.sourceRoots` en busca de llamadas `t("literal")` y `i18n.t("literal")`. Escribe (o fusiona en) `ui.stringsJson`.

El escáner es configurable: puede agregar nombres personalizados de funciones mediante `ui.reactExtractor.funcNames`.

### Paso 3: Traducir cadenas de la interfaz de usuario {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes a OpenRouter para cada configuración regional de destino y escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`.

### Paso 4: Conectar i18next en tiempo de ejecución {{DOC_HEADING-ID_0}}

Cree su archivo de configuración i18n usando los ayudantes exportados por `'ai-i18n-tools/runtime'`:

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Importe `i18n.js` antes de que React renderice (por ejemplo, al principio de su punto de entrada). Cuando el usuario cambie el idioma, llame a `await loadLocale(code)` y luego a `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` se exporta para que cualquier otro archivo que lo necesite (por ejemplo, un selector de idioma) pueda importarlo directamente desde `'./i18n'`.

`**defaultI18nInitOptions(sourceLocale)**` devuelve las opciones estándar para configuraciones donde la clave es el valor por defecto:

- `parseMissingKeyHandler` devuelve la clave misma, por lo que las cadenas no traducidas muestran el texto fuente.
- `nsSeparator: false` permite claves que contienen dos puntos.
- `interpolation.escapeValue: false`: es seguro desactivarlo: React escapa los valores por sí mismo, y la salida de Node.js/CLI no tiene HTML que escapar.

`**wrapI18nWithKeyTrim(i18n)**` envuelve `i18n.t` para que: (1) las claves se recorten antes de la búsqueda, coincidiendo con cómo el script de extracción las almacena; (2) la interpolación <code>{"{{var}}"}</code> se aplique cuando la configuración regional fuente devuelva la clave cruda, por lo que <code>{"t('Hello {{name}}', { name })"}</code> funcione correctamente incluso para el idioma fuente.

`**makeLoadLocale(i18n, loaders, sourceLocale)**` devuelve una función asíncrona `loadLocale(lang)` que importa dinámicamente el paquete JSON para una configuración regional y lo registra con i18next.

### Uso de `t()` en el código fuente {#using-t-in-source-code}

Llame a `t()` con una **cadena literal** para que el script de extracción pueda encontrarla:

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
- La clave debe ser una **cadena literal**: no se permiten variables ni expresiones como clave.
- No use literales de plantilla para la clave: <code>{'t(`Hello ${name}`)'}</code> no es extraíble.

### Interpolación {#interpolation}

Use la interpolación nativa de i18next mediante el segundo argumento para los marcadores de posición <code>{"{{var}}"}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

El script de extracción ignora el segundo argumento; solo se extrae y envía para traducción la cadena literal <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code>. Se instruye a los traductores a preservar los tokens <code>{"{{...}}"}</code>.

### Interfaz de selector de idioma {#language-switcher-ui}

Use el manifiesto `ui-languages.json` para crear un selector de idiomas. `ai-i18n-tools` exporta dos ayudantes para mostrar:

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

`**getUILanguageLabel(lang, t)**` - muestra `t(englishName)` cuando está traducido, o `englishName / t(englishName)` cuando ambos difieren. Adecuado para pantallas de configuración.

`**getUILanguageLabelNative(lang)**` - muestra `englishName / label` (sin llamada a `t()` en cada fila). Adecuado para menús de cabecera donde se desea que el nombre nativo sea visible.

El manifiesto `ui-languages.json` es un array JSON de entradas <code>{"{ code, label, englishName }"}</code>. Ejemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

Establece `targetLocales` en la configuración con la ruta de este archivo para que el comando de traducción use la misma lista.

### Idiomas RTL {#rtl-languages}

`ai-i18n-tools` exporta `getTextDirection(lng)` y `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` establece `document.documentElement.dir` (navegador) o no hace nada (Node.js). Pasa un argumento opcional `element` para aplicarlo a un elemento específico.

Para cadenas que puedan contener flechas `→`, inviértelas para diseños RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Flujo de trabajo 2 - Traducción de documentos {#workflow-2---document-translation}

Diseñado para documentación en markdown, sitios Docusaurus, archivos JSON de etiquetas y diagramas SVG.

### Paso 1: Inicializar {#step-1-initialize-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edita el archivo generado `ai-i18n-tools.config.json`:

- `sourceLocale`: idioma de origen (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales`: array de códigos de idioma o ruta a un manifiesto.
- `documentation.contentPaths`: directorios o archivos fuente de markdown/SVG.
- `documentation.outputDir`: directorio raíz de salida para las traducciones.
- `documentation.markdownOutput.style`: `"docusaurus"` o `"flat"` (ver [Diseños de salida](#output-layouts)).

### Paso 2: Traducir documentos {#step-2-translate-documents}

```bash
npx ai-i18n-tools translate-docs
```

Esto traduce todos los archivos en `documentation.contentPaths` a todos los `targetLocales` (o `documentation.targetLocales` si está definido). Los segmentos ya traducidos se sirven desde la caché SQLite; solo los segmentos nuevos o modificados se envían al LLM.

Para traducir un solo idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para comprobar qué necesita traducción:

```bash
npx ai-i18n-tools status
```

#### Comportamiento de la caché y banderas de `translate-docs` {#cache-behavior-and-translate-docs-flags}

La CLI mantiene un **seguimiento de archivos** en SQLite (hash de origen por archivo × idioma) y filas de **segmentos** (hash × idioma por fragmento traducible). Una ejecución normal omite completamente un archivo cuando el hash registrado coincide con el origen actual **y** el archivo de salida ya existe; de lo contrario, procesa el archivo y usa la caché de segmentos, por lo que el texto sin cambios no llama a la API.

| Bandera                  | Efecto                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(por defecto)*          | Omite archivos sin cambios cuando el seguimiento y la salida en disco coinciden; usa la caché de segmentos para el resto.                                                                                                             |
| `--force-update`         | Vuelve a procesar cada archivo coincidente (extrae, reensambla, escribe salidas) incluso cuando el seguimiento de archivos lo omitiría. **La caché de segmentos sigue aplicándose** - los segmentos sin cambios no se envían al LLM.                   |
| `--force`                | Borra el seguimiento de archivos para cada archivo procesado y **no lee** la caché de segmentos para la traducción de la API (retraducción completa). Los nuevos resultados aún se **escriben** en la caché de segmentos.                 |
| `--stats`                | Muestra recuentos de segmentos, recuentos de archivos rastreados y totales de segmentos por idioma, luego finaliza.                                                                                                                   |
| `--clear-cache [locale]` | Elimina las traducciones en caché (y el seguimiento de archivos): todos los idiomas, o un solo idioma, luego finaliza.                                                                                                            |

No puedes combinar `--force` con `--force-update` (son mutuamente excluyentes).

### Distribuciones de salida {#output-layouts}

`**"docusaurus"`** - coloca los archivos traducidos en `i18n/<locale>/docusaurus-plugin-content-docs/current/<relPath>`, reflejando la estructura de carpetas estándar de i18n de Docusaurus. Establece `documentation.markdownOutput.docsRoot` como la raíz del origen de la documentación (por ejemplo, `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`**"flat"**` - coloca los archivos traducidos junto al archivo fuente con un sufijo de configuración regional, o en un subdirectorio. Los enlaces relativos entre páginas se reescriben automáticamente.

```
docs/guide.md → i18n/guide.de.md
```

Puedes anular completamente las rutas con `documentation.markdownOutput.pathTemplate`. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Flujo de trabajo combinado (UI + Docs) {#combined-workflow-ui--docs}

Habilita todas las características en una sola configuración para ejecutar ambos flujos de trabajo juntos:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
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
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "markdownOutput": { "style": "flat" }
  }
}
```

`glossary.uiGlossary` dirige la traducción de documentos al mismo catálogo `strings.json` que la interfaz de usuario para mantener una terminología coherente; `glossary.userGlossary` agrega anulaciones en CSV para términos del producto.

Ejecuta `npx ai-i18n-tools sync` para ejecutar una única canalización: **extraer** cadenas de la interfaz de usuario (si `features.extractUIStrings`), **traducir** cadenas de la interfaz de usuario (si `features.translateUIStrings`), **traducir** recursos SVG independientes (si hay un bloque `svg` en la configuración), y luego **traducir la documentación** (markdown/JSON bajo `documentation`). Omite partes con `--no-ui`, `--no-svg` o `--no-docs`. El paso de documentación acepta `--dry-run`, `-p` / `--path`, `--force` y `--force-update` (los dos últimos solo se aplican cuando se ejecuta la traducción de documentación; se ignoran si usas `--no-docs`).

Usa `documentation.targetLocales` para traducir la documentación a un **subconjunto más pequeño** que la interfaz de usuario:

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentation": {
    "targetLocales": ["de", "fr", "es"]
  }
}
```

---

## Referencia de configuración {#configuration-reference}

### `sourceLocale` {#sourcelocale}

Código BCP-47 del idioma fuente (por ejemplo, `"en-GB"`, `"en"`, `"pt-BR"`). No se genera ningún archivo de traducción para esta configuración regional; la propia cadena clave es el texto fuente.

**Debe coincidir** con `SOURCE_LOCALE` exportado desde tu archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Qué configuraciones regionales se traducirán. Acepta:

- **Ruta como cadena** a un manifiesto `ui-languages.json` (`"src/locales/ui-languages.json"`). El archivo se carga y se extraen los códigos de configuración regional.
- **Matriz de códigos BCP-47** (`["de", "fr", "es"]`).
- **Matriz de un solo elemento con una ruta** (`["src/locales/ui-languages.json"]`) - comportamiento idéntico a la forma de cadena.

### `concurrency` (opcional) {#concurrency-optional}

Máximo número de **configuraciones regionales objetivo** que se traducen simultáneamente (`translate-ui`, `translate-docs`, `translate-svg` y los pasos correspondientes dentro de `sync`). Si se omite, la CLI utiliza **4** para la traducción de la interfaz de usuario y **3** para la traducción de documentación (valores predeterminados integrados). Puedes anularlo por ejecución con `-j` / `--concurrency`.

### `batchConcurrency` (opcional) {#batchconcurrency-optional}

**translate-docs** y **translate-svg** (y el paso de documentación de `sync`): número máximo de solicitudes paralelas por lotes (batch) de OpenRouter por archivo (cada lote puede contener muchos segmentos). Valor predeterminado **4** si se omite. Ignorado por `translate-ui`. Puede sobrescribirse con `-b` / `--batch-concurrency`. En `sync`, `-b` solo aplica al paso de traducción de documentación.

### `batchSize` / `maxBatchChars` (opcional) {#batchsize--maxbatchchars-optional}

Agrupación de segmentos para la traducción de documentos: número de segmentos por solicitud API y límite máximo de caracteres. Valores predeterminados: **20** segmentos, **4096** caracteres (cuando se omiten).

### `openrouter` {#openrouter}

| Campo               | Descripción                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | URL base de la API de OpenRouter. Valor predeterminado: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Lista ordenada de IDs de modelos. El primero se intenta primero; los siguientes son alternativas en caso de error. |
| `maxTokens`         | Número máximo de tokens de finalización por solicitud. Valor predeterminado: `8192`.                                      |
| `temperature`       | Temperatura de muestreo. Valor predeterminado: `0.2`.                                                    |

Establezca `OPENROUTER_API_KEY` en su entorno o en el archivo `.env`.

### `features` {#features}

| Campo                | Flujo | Descripción                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | Escanea el código fuente en busca de `t("…")` y escribe/fusiona `strings.json`.          |
| `translateUIStrings` | 1        | Traduce las entradas de `strings.json` y escribe archivos JSON por idioma. |
| `translateMarkdown`  | 2        | Traduce archivos `.md` / `.mdx`.                                   |
| `translateJSON`      | 2        | Traduce archivos JSON de etiquetas de Docusaurus.                            |
| `translateSVG`       | 2        | Traduce el contenido de texto en archivos `.svg`.                           |

### `ui` {#ui}

| Campo                       | Descripción                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Directorios (relativos al directorio actual) escaneados en busca de llamadas a `t("…")`.               |
| `stringsJson`               | Ruta al archivo de catálogo maestro. Actualizado por `extract`.                  |
| `flatOutputDir`             | Directorio donde se escriben los archivos JSON por idioma (`de.json`, etc.).    |
| `reactExtractor.funcNames`  | Nombres adicionales de funciones a escanear (valor predeterminado: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensiones de archivo a incluir (valor predeterminado: `[".js", ".jsx", ".ts", ".tsx"]`). |

### `documentation` {#documentation}

| Campo                                        | Descripción                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contentPaths`                               | Archivos o directorios de origen a traducir (markdown, JSON, SVG).                                                                                                                                                         |
| `outputDir`                                  | Directorio raíz para la salida traducida.                                                                                                                                                                                 |
| `cacheDir`                                   | Directorio de caché SQLite. Reutilizable entre ejecuciones para traducción incremental.                                                                                                                                    |
| `targetLocales`                              | Subconjunto opcional de idiomas solo para documentación (anula `targetLocales` raíz).                                                                                                                                     |
| `jsonSource`                                 | Directorio de origen para archivos JSON de etiquetas de Docusaurus (por ejemplo, `"i18n/en"`).                                                                                                                                              |
| `markdownOutput.style`                       | `"docusaurus"` o `"flat"`.                                                                                                                                                                                               |
| `markdownOutput.docsRoot`                    | Raíz de documentación de origen para el diseño Docusaurus (por ejemplo, `"docs"`).                                                                                                                                                        |
| `markdownOutput.pathTemplate`                | Plantilla personalizada de ruta de salida. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>.                                                                                                                        |
| `markdownOutput.rewriteRelativeLinks` | Reescribir enlaces relativos tras la traducción (activado automáticamente para el estilo `flat`).                                                                                                                         |
| `injectTranslationMetadata`                  | Cuando es `true` (valor predeterminado si se omite), los archivos markdown traducidos incluyen claves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Establecer en `false` para omitirlo. |

### `glossary` {#glossary}

| Campo          | Descripción                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Ruta a `strings.json` - crea automáticamente un glosario a partir de las traducciones existentes.                                                                                                                 |
| `userGlossary` | Ruta a un CSV con columnas `**Cadena en idioma original**` (o `**en**`), `**locale**`, `**Traducción**` - una fila por término fuente y configuración regional de destino (`locale` puede ser `*` para todos los destinos). |

La clave heredada `uiGlossaryFromStringsJson` aún se acepta y se asigna a `uiGlossary` al cargar la configuración.

Generar un archivo CSV de glosario vacío:

```bash
npx ai-i18n-tools glossary-generate
```

---

## Referencia de la CLI {#cli-reference}

| Comando                                                                   | Descripción                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Escribe un archivo de configuración inicial (incluye `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, y `documentation.injectTranslationMetadata`). `--with-translate-ignore` crea un archivo `.translate-ignore` inicial.                                                                            |
| `extract`                                                                 | Escanea el código fuente en busca de llamadas `t("…")` y actualiza `strings.json`. Requiere `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Traduce archivos de documentación bajo `documentation.contentPaths` (markdown, MDX, archivos JSON de etiquetas, y cualquier `.svg` incluido allí). `-j`: máximo de localizaciones en paralelo; `-b`: máximo de llamadas paralelas a la API por archivo. Consulta [Comportamiento de caché y banderas de `translate-docs`](#cache-behavior-and-translate-docs-flags) para `--force`, `--force-update`, `--stats`, `--clear-cache`. |
| `translate-svg …`                                                         | Traduce recursos SVG independientes configurados en `config.svg` (separado de la documentación). Misma lógica de caché que en la documentación; admite `--no-cache` para omitir lecturas/escrituras SQLite en esa ejecución. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [-j <n>]`                                 | Traduce solo las cadenas de la interfaz de usuario. `-j`: máximo de localizaciones en paralelo. Requiere `features.translateUIStrings`.                                                                                                                                                                                                     |
| `sync …`                                                                  | Extrae (si está habilitado), luego traducción de la interfaz, luego `translate-svg` cuando existe `config.svg`, y finalmente la traducción de la documentación, a menos que se omita con `--no-ui`, `--no-svg` o `--no-docs`. Banderas compartidas: `-l`, `-p`, `--dry-run`, `-j`, `-b` (solo para agrupación de documentos), `--force` / `--force-update` (solo para documentos; se excluyen mutuamente cuando se ejecutan los documentos).                         |
| `status`                                                                  | Muestra el estado de traducción de los archivos markdown por archivo × localización (sin filtro `--locale`; las localizaciones provienen de la configuración).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>] [-y]`                  | Elimina filas obsoletas (con `last_hit_at` nulo / ruta de archivo vacía) y filas huérfanas (archivos faltantes). Antes de modificar la base de datos, solicita confirmación (a menos que se use `--dry-run` o `--yes`): ejecuta primero `translate-docs --force-update` para que el seguimiento y los accesos a caché estén actualizados. Crea una copia de seguridad de SQLite con marca de tiempo en el directorio de caché a menos que se use `--no-backup`. Usa `--yes` cuando la entrada estándar no es un TTY. |
| `editor [-p <port>]`                                                      | Inicia un editor web local para la caché, `strings.json` y el archivo CSV de glosario.                                                                                                                                                                                                                         |
| `glossary-generate`                                                       | Escribe una plantilla vacía de `glossary-user.csv`.                                                                                                                                                                                                                                                       |

Todos los comandos aceptan `-c <ruta>` para especificar un archivo de configuración no predeterminado, `-v` para salida detallada y `-w` / `--write-logs [ruta]` para duplicar la salida de la consola en un archivo de registro (ruta predeterminada: dentro de `documentation.cacheDir`).

---

## Variables de entorno {#environment-variables}

| Variable               | Descripción                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Requerido.** Tu clave API de OpenRouter.                 |
| `OPENROUTER_BASE_URL`  | Reemplaza la URL base de la API.                           |
| `I18N_SOURCE_LOCALE`   | Reemplaza `sourceLocale` en tiempo de ejecución.          |
| `I18N_TARGET_LOCALES`  | Códigos de configuración regional separados por comas para reemplazar `targetLocales`. |
| `I18N_LOG_LEVEL`       | Nivel del registrador (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Cuando vale `1`, desactiva los colores ANSI en la salida del registro. |
| `I18N_LOG_SESSION_MAX` | Número máximo de líneas conservadas por sesión de registro (predeterminado `5000`). |
