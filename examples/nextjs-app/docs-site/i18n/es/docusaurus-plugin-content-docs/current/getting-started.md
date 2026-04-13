---
translation_last_updated: '2026-04-13T00:28:34.167Z'
source_file_mtime: '2026-04-13T00:28:15.565Z'
source_file_hash: c8918e0004d77e154c0fa0f750e67e8d78e9c673ca048942b309582cb3f5c8b8
translation_language: es
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools: Introducción

`ai-i18n-tools` proporciona dos flujos de trabajo independientes y componibles:

- **Flujo de trabajo 1 - Traducción de UI**: extrae llamadas `t("…")` de cualquier fuente JS/TS, tradúcelas a través de OpenRouter y escribe archivos JSON planos por localidad listos para i18next.
- **Flujo de trabajo 2 - Traducción de Documentos**: traduce archivos markdown (MDX) y etiquetas JSON de Docusaurus a cualquier número de localidades, con almacenamiento en caché inteligente. Los activos **SVG** utilizan un comando separado (`translate-svg`) y una configuración opcional `svg` (ver [referencia de CLI](#cli-reference)).

Ambos flujos de trabajo utilizan OpenRouter (cualquier LLM compatible) y comparten un único archivo de configuración.

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[en-GB](./GETTING_STARTED.md) · [de](../translated-docs/docs/GETTING_STARTED.de.md) · [es](../translated-docs/docs/GETTING_STARTED.es.md) · [fr](../translated-docs/docs/GETTING_STARTED.fr.md) · [hi](../translated-docs/docs/GETTING_STARTED.hi.md) · [ja](../translated-docs/docs/GETTING_STARTED.ja.md) · [ko](../translated-docs/docs/GETTING_STARTED.ko.md) · [pt-BR](../translated-docs/docs/GETTING_STARTED.pt-BR.md) · [zh-CN](../translated-docs/docs/GETTING_STARTED.zh-CN.md) · [zh-TW](../translated-docs/docs/GETTING_STARTED.zh-TW.md)</small>

---

<!-- INICIO doctoc generado TOC por favor mantenga el comentario aquí para permitir la actualización automática -->
<!-- NO EDITAR ESTA SECCIÓN, EN SU LUGAR VUELVA A EJECUTAR doctoc PARA ACTUALIZAR -->
**Tabla de Contenidos**

- [Instalación](#installation)
- [Inicio Rápido](#quick-start)
- [Flujo de trabajo 1 - Traducción de UI](#workflow-1---ui-translation)
  - [Paso 1: Inicializar](#step-1-initialise)
  - [Paso 2: Extraer cadenas](#step-2-extract-strings)
  - [Paso 3: Traducir cadenas de UI](#step-3-translate-ui-strings)
  - [Paso 4: Conectar i18next en tiempo de ejecución](#step-4-wire-i18next-at-runtime)
  - [Usando `t()` en el código fuente](#using-t-in-source-code)
  - [Interpolación](#interpolation)
  - [Interfaz de cambio de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Flujo de trabajo 2 - Traducción de Documentos](#workflow-2---document-translation)
  - [Paso 1: Inicializar](#step-1-initialise-1)
  - [Paso 2: Traducir documentos](#step-2-translate-documents)
    - [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags)
  - [Diseños de salida](#output-layouts)
- [Flujo de trabajo combinado (UI + Documentos)](#combined-workflow-ui--docs)
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

## Instalación {#installation}

El paquete publicado es **solo ESM**. Usa `import`/`import()` en Node.js o tu empaquetador; **no uses `require('ai-i18n-tools')`.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Establece tu clave API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O crea un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Inicio Rápido {#quick-start}

La plantilla `init` por defecto (`ui-markdown`) habilita solo la extracción y traducción de **UI**. La plantilla `ui-docusaurus` habilita la traducción de **documentos** (`translate-docs`). Usa `sync` cuando desees un comando que ejecute la extracción, traducción de UI, traducción SVG opcional independiente y traducción de documentación según tu configuración.

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

## Flujo de trabajo 1 - Traducción de UI {#workflow-1---ui-translation}

Diseñado para cualquier proyecto JS/TS que use i18next: aplicaciones React, Next.js (componentes del cliente y del servidor), servicios de Node.js, herramientas de CLI.

### Paso 1: Inicializar {#step-1-initialise}

```bash
npx ai-i18n-tools init
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown`. Edítalo para establecer:

- `sourceLocale` - el código de idioma BCP-47 de tu idioma fuente (por ejemplo, `"en-GB"`). **Debe coincidir** con `SOURCE_LOCALE` exportado de tu archivo de configuración i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - ruta a tu manifiesto `ui-languages.json` O un array de códigos BCP-47.
- `ui.sourceRoots` - directorios para escanear en busca de llamadas a `t("…")` (por ejemplo, `["src/"]`).
- `ui.stringsJson` - dónde escribir el catálogo maestro (por ejemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - dónde escribir `de.json`, `pt-BR.json`, etc. (por ejemplo, `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID del modelo OpenRouter que intentar **primero** para `translate-ui` solamente; en caso de fallo, la CLI continúa con `openrouter.translationModels` (o el legado `defaultModel` / `fallbackModel`) en orden, omitiendo duplicados.

### Paso 2: Extraer cadenas {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Escanea todos los archivos JS/TS bajo `ui.sourceRoots` en busca de llamadas a `t("literal")` e `i18n.t("literal")`. Escribe (o fusiona en) `ui.stringsJson`.

El escáner es configurable: añade nombres de funciones personalizadas a través de `ui.reactExtractor.funcNames`.

### Paso 3: Traducir cadenas de UI {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes a OpenRouter para cada idioma de destino, escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. Cuando `ui.preferredModel` está configurado, ese modelo se intenta antes de la lista ordenada en `openrouter.translationModels` (la traducción de documentos y otros comandos aún utilizan solo `openrouter`).

Para cada entrada, `translate-ui` almacena el **id del modelo OpenRouter** que tradujo con éxito cada idioma en un objeto `models` opcional (las mismas claves de idioma que `translated`). Las cadenas editadas en el comando local `editor` están marcadas con el valor centinela `user-edited` en `models` para ese idioma. Los archivos planos por idioma bajo `ui.flatOutputDir` permanecen **cadena fuente → traducción** solamente; no incluyen `models` (por lo que los paquetes de tiempo de ejecución permanecen sin cambios).

> **Nota sobre el uso del Editor de Caché:** Si editas una entrada en el editor de caché, necesitas ejecutar un `sync --force-update` (o el comando `translate` equivalente con `--force-update`) para reescribir los archivos de salida con la entrada de caché actualizada. Además, ten en cuenta que si el texto fuente cambia más tarde, tu edición manual se perderá porque se generará una nueva clave de caché (hash) para la nueva cadena fuente.

### Paso 4: Conectar i18next en tiempo de ejecución {#step-4-wire-i18next-at-runtime}

Crea tu archivo de configuración i18n utilizando los helpers exportados por `'ai-i18n-tools/runtime'`:

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

Importa `i18n.js` antes de que React renderice (por ejemplo, en la parte superior de tu punto de entrada). Cuando el usuario cambie de idioma, llama a `await loadLocale(code)` y luego `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` se exporta para que cualquier otro archivo que lo necesite (por ejemplo, un conmutador de idioma) pueda importarlo directamente desde `'./i18n'`.

`defaultI18nInitOptions(sourceLocale)` devuelve las opciones estándar para configuraciones de clave como predeterminadas:

- `parseMissingKeyHandler` devuelve la clave en sí, por lo que las cadenas no traducidas muestran el texto fuente.
- `nsSeparator: false` permite claves que contienen dos puntos.
- `interpolation.escapeValue: false` - seguro desactivarlo: React escapa los valores por sí mismo, y la salida de Node.js/CLI no tiene HTML que escapar.

`wrapI18nWithKeyTrim(i18n)` envuelve `i18n.t` de modo que: (1) las claves se recortan antes de la búsqueda, coincidiendo con cómo el script de extracción las almacena; (2) se aplica la interpolación <code>{"{{var}}"}</code> cuando el idioma fuente devuelve la clave sin procesar - así que <code>{"t('Hola {{name}}', { name })"}</code> funciona correctamente incluso para el idioma fuente.

`makeLoadLocale(i18n, loaders, sourceLocale)` devuelve una función asíncrona `loadLocale(lang)` que importa dinámicamente el paquete JSON para un idioma y lo registra con i18next.

### Usando `t()` en el código fuente {#using-t-in-source-code}

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
- La clave debe ser una **cadena literal** - no se permiten variables ni expresiones como clave.
- No utilices literales de plantilla para la clave: <code>{'t(`Hello ${name}`)'}</code> no es extraíble.

### Interpolación {#interpolation}

Utiliza la interpolación nativa de segundo argumento de i18next para los marcadores de posición <code>{"{{var}}"}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

El script de extracción ignora el segundo argumento - solo se extrae y envía para traducción la cadena de clave literal <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code>. Se instruye a los traductores que conserven los tokens <code>{"{{...}}"}</code>.

### Interfaz de cambio de idioma {#language-switcher-ui}

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

`getUILanguageLabel(lang, t)` - muestra `t(englishName)` cuando se traduce, o `englishName / t(englishName)` cuando ambos difieren. Adecuado para pantallas de configuración.

`getUILanguageLabelNative(lang)` - muestra `englishName / label` (sin llamada a `t()` en cada fila). Adecuado para menús de encabezado donde deseas que el nombre nativo sea visible.

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

Establece `targetLocales` en la configuración a la ruta de este archivo para que el comando de traducción utilice la misma lista.

### Idiomas RTL {#rtl-languages}

`ai-i18n-tools` exporta `getTextDirection(lng)` y `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` establece `document.documentElement.dir` (navegador) o es una operación no efectiva (Node.js). Pasa un argumento opcional `element` para dirigirte a un elemento específico.

Para cadenas que pueden contener flechas `→`, inviértelas para diseños RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Flujo de trabajo 2 - Traducción de documentos {#workflow-2---document-translation}

Diseñado para documentación en markdown, sitios de Docusaurus y archivos de etiquetas JSON. Los diagramas SVG se traducen a través de [`translate-svg`](#cli-reference) y `svg` en la configuración, no a través de `documentations[].contentPaths`.

### Paso 1: Inicializar {#step-1-initialise-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edita el `ai-i18n-tools.config.json` generado:

- `sourceLocale` - idioma fuente (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales` - array de códigos de locales o ruta a un manifiesto.
- `cacheDir` - directorio de caché SQLite compartido para todos los pipelines de documentación (y directorio de registro predeterminado para `--write-logs`).
- `documentations` - array de bloques de documentación. Cada bloque tiene una `description` opcional, `contentPaths`, `outputDir`, `jsonSource` opcional, `markdownOutput`, `targetLocales`, `injectTranslationMetadata`, etc.
- `documentations[].description` - nota corta opcional para los mantenedores (lo que cubre este bloque). Cuando se establece, aparece en el encabezado de `translate-docs` (`🌐 …: traduciendo …`) y en los encabezados de sección de `status`.
- `documentations[].contentPaths` - directorios o archivos fuente markdown/MDX (ver también `documentations[].jsonSource` para etiquetas JSON).
- `documentations[].outputDir` - raíz de salida traducida para ese bloque.
- `documentations[].markdownOutput.style` - `"nested"` (predeterminado), `"docusaurus"`, o `"flat"` (ver [Diseños de salida](#output-layouts)).

### Paso 2: Traducir documentos {#step-2-translate-documents}

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

#### Comportamiento de la caché y banderas de `translate-docs` {#cache-behaviour-and-translate-docs-flags}

La CLI mantiene **seguimiento de archivos** en SQLite (hash de origen por archivo × locale) y filas de **segmentos** (hash × locale por fragmento traducible). Una ejecución normal omite un archivo por completo cuando el hash rastreado coincide con el origen actual **y** el archivo de salida ya existe; de lo contrario, procesa el archivo y utiliza la caché de segmentos para que el texto sin cambios no llame a la API.

| Bandera                  | Efecto                                                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *(predeterminado)*              | Omite archivos sin cambios al rastrear + coincidencia de salida en disco; usa caché de segmentos para el resto.                                                                                           |
| `--force-update`         | Reprocesa cada archivo coincidente (extraer, reensamblar, escribir salidas) incluso cuando el rastreo de archivos lo omitiría. **La caché de segmentos sigue aplicándose** - los segmentos sin cambios no se envían al LLM.                   |
| `--force`                | Borra el rastreo de archivos para cada archivo procesado y **no lee** la caché de segmentos para la traducción de API (re-traducción completa). Los nuevos resultados aún se **escriben** en la caché de segmentos.                 |
| `--stats`                | Imprime conteos de segmentos, conteos de archivos rastreados y totales de segmentos por idioma, luego sale.                                                                                               |
| `--clear-cache [locale]` | Elimina traducciones en caché (y rastreo de archivos): todos los idiomas, o un solo idioma, luego sale.                                                                                                  |
| `--prompt-format <mode>` | Cómo se envía cada **lote** de segmentos al modelo y se analiza (`xml`, `json-array`, o `json-object`). Predeterminado **`xml`**. No cambia la extracción, los marcadores de posición, la validación, la caché o el comportamiento de retroceso — ver [Formato de lote de solicitud](#batch-prompt-format). |

No puedes combinar `--force` con `--force-update` (son mutuamente excluyentes).

#### Formato de lote de solicitud {#batch-prompt-format}

`translate-docs` envía segmentos traducibles a OpenRouter en **lotes** (agrupados por `batchSize` / `maxBatchChars`). La **`--prompt-format`** bandera solo cambia el **formato de transmisión** de ese lote; la división de segmentos, los tokens de `PlaceholderHandler`, las comprobaciones de AST de markdown, las claves de caché de SQLite y la recuperación por segmento cuando falla el análisis del lote permanecen sin cambios.

| Modo                | Mensaje del usuario | Respuesta del modelo |
| ------------------- | ------------------- | -------------------- |
| **`xml`** (predeterminado) | Pseudo-XML: un `<seg id="N">…</seg>` por segmento (con escape XML). | Solo bloques `<t id="N">…</t>`, uno por índice de segmento. |
| **`json-array`** | Un array JSON de cadenas, una entrada por segmento en orden. | Un array JSON de la **misma longitud** (mismo orden). |
| **`json-object`** | Un objeto JSON `{"0":"…","1":"…",…}` indexado por índice de segmento. | Un objeto JSON con las **mismas claves** y valores traducidos. |

El encabezado de ejecución también imprime `Formato de aviso de lote: …` para que puedas confirmar el modo activo. Los archivos de etiquetas JSON (`jsonSource`) y los lotes SVG independientes utilizan la misma configuración cuando esos pasos se ejecutan como parte de `translate-docs` (o la fase de documentos de `sync` — `sync` no expone esta bandera; se establece de forma predeterminada en **`xml`**).

**Dedupe de segmentos y rutas en SQLite**

- Las filas de segmentos se indexan globalmente por `(source_hash, locale)` (hash = contenido normalizado). El texto idéntico en dos archivos comparte una fila; `translations.filepath` es metadatos (último escritor), no una segunda entrada de caché por archivo.
- `file_tracking.filepath` utiliza claves con espacio de nombres: `doc-block:{index}:{relPath}` por bloque de `documentations` (`relPath` es relativo a la raíz del proyecto posix: rutas de markdown como se recopilaron; **los archivos de etiquetas JSON utilizan la ruta relativa al cwd del archivo fuente**, por ejemplo, `docs-site/i18n/en/code.json`, para que la limpieza pueda resolver el archivo real), y `svg-assets:{relPath}` para activos SVG independientes bajo `translate-svg`.
- `translations.filepath` almacena rutas posix relativas al cwd para segmentos de markdown, JSON y SVG (SVG utiliza la misma forma de ruta que otros activos; el prefijo `svg-assets:…` es **solo** en `file_tracking`).
- Después de una ejecución, `last_hit_at` se borra solo para las filas de segmento **en el mismo ámbito de traducción** (respetando `--path` y tipos habilitados) que no fueron alcanzadas, por lo que una ejecución filtrada o solo de documentos no marca archivos no relacionados como obsoletos.

### Diseños de salida {#output-layouts}

`"nested"` (predeterminado cuando se omite) — refleja el árbol fuente bajo `{outputDir}/{locale}/` (por ejemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — coloca archivos que se encuentran bajo `docsRoot` en `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, coincidiendo con la disposición habitual de i18n de Docusaurus. Establece `documentations[].markdownOutput.docsRoot` en la raíz de tu fuente de documentos (por ejemplo, `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - coloca archivos traducidos junto a la fuente con un sufijo de localidad, o en un subdirectorio. Los enlaces relativos entre páginas se reescriben automáticamente.

```
docs/guide.md → i18n/guide.de.md
```

Puedes anular las rutas completamente con `documentations[].markdownOutput.pathTemplate`. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Flujo de trabajo combinado (UI + Docs) {#combined-workflow-ui--docs}

Habilita todas las funciones en una única configuración para ejecutar ambos flujos de trabajo juntos:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
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

`glossary.uiGlossary` apunta la traducción de documentos al mismo catálogo `strings.json` que la UI para que la terminología se mantenga consistente; `glossary.userGlossary` añade anulaciones CSV para términos de producto.

Ejecuta `npx ai-i18n-tools sync` para ejecutar un pipeline: **extraer** cadenas de UI (si `features.extractUIStrings`), **traducir** cadenas de UI (si `features.translateUIStrings`), **traducir activos SVG independientes** (si hay un bloque `svg` presente en la configuración), luego **traducir documentación** (cada bloque `documentations`: markdown/JSON según lo configurado). Omite partes con `--no-ui`, `--no-svg`, o `--no-docs`. El paso de docs acepta `--dry-run`, `-p` / `--path`, `--force`, y `--force-update` (los dos últimos solo se aplican cuando se ejecuta la traducción de documentación; se ignoran si pasas `--no-docs`).

Usa `documentations[].targetLocales` en un bloque para traducir los archivos de ese bloque a un **subconjunto más pequeño** que la UI (los locales de documentación efectivos son la **unión** entre bloques):

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

---

## Referencia de configuración {#configuration-reference}

### `sourceLocale` {#sourcelocale}

Código BCP-47 para el idioma de origen (por ejemplo, `"en-GB"`, `"en"`, `"pt-BR"`). No se genera un archivo de traducción para esta localidad - la cadena clave en sí es el texto fuente.

**Debe coincidir** con `SOURCE_LOCALE` exportado desde tu archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Qué localidades traducir. Acepta:

- **Ruta de cadena** a un manifiesto `ui-languages.json` (`"src/locales/ui-languages.json"`). El archivo se carga y se extraen los códigos de localidad.
- **Array de códigos BCP-47** (`["de", "fr", "es"]`).
- **Array de un elemento con una ruta** (`["src/locales/ui-languages.json"]`) - mismo comportamiento que la forma de cadena.

`targetLocales` es la lista de localidades principal para la traducción de UI y la lista de localidades por defecto para los bloques de documentación. Si prefieres mantener un array explícito aquí pero aún quieres etiquetas impulsadas por el manifiesto y filtrado de localidades, también establece `uiLanguagesPath`.

### `uiLanguagesPath` (opcional) {#uilanguagespath-optional}

Ruta a un manifiesto `ui-languages.json` utilizado para nombres de visualización, filtrado de localidades y post-procesamiento de la lista de idiomas.

Usa esto cuando:

- `targetLocales` es un array explícito, pero aún quieres etiquetas en inglés/nativas del manifiesto.
- Quieres que `markdownOutput.postProcessing.languageListBlock` construya etiquetas de localidad a partir del mismo manifiesto.
- Solo se habilita la traducción de UI y quieres que el manifiesto proporcione la lista efectiva de localidades de UI.

### `concurrency` (opcional) {#concurrency-optional}

Máximo **locales de destino** traducidos al mismo tiempo (`translate-ui`, `translate-docs`, `translate-svg`, y los pasos correspondientes dentro de `sync`). Si se omite, la CLI utiliza **4** para la traducción de UI y **3** para la traducción de documentación (valores predeterminados integrados). Sobrescribir por ejecución con `-j` / `--concurrency`.

### `batchConcurrency` (opcional) {#batchconcurrency-optional}

**translate-docs** y **translate-svg** (y el paso de documentación de `sync`): máximo de solicitudes **batch** paralelas de OpenRouter por archivo (cada batch puede contener muchos segmentos). Predeterminado **4** cuando se omite. Ignorado por `translate-ui`. Sobrescribir con `-b` / `--batch-concurrency`. En `sync`, `-b` se aplica solo al paso de traducción de documentación.

### `batchSize` / `maxBatchChars` (opcional) {#batchsize--maxbatchchars-optional}

Agrupación de segmentos para la traducción de documentos: cuántos segmentos por solicitud API y un límite de caracteres. Predeterminados: **20** segmentos, **4096** caracteres (cuando se omite).

### `openrouter` {#openrouter}

| Campo               | Descripción                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `baseUrl`           | URL base de la API de OpenRouter. Predeterminado: `https://openrouter.ai/api/v1`.          |
| `translationModels` | Lista ordenada preferida de IDs de modelo. El primero se prueba primero; las entradas posteriores son alternativas en caso de error. Solo para `translate-ui`**, también puedes establecer `ui.preferredModel` para probar un modelo antes de esta lista (ver `ui`). |
| `defaultModel`      | Modelo primario único heredado. Se utiliza solo cuando `translationModels` no está establecido o está vacío. |
| `fallbackModel`     | Modelo de respaldo único heredado. Se utiliza después de `defaultModel` cuando `translationModels` no está establecido o está vacío. |
| `maxTokens`         | Máximo de tokens de finalización por solicitud. Predeterminado: `8192`.                       |
| `temperature`       | Temperatura de muestreo. Predeterminado: `0.2`.                                             |

Establece `OPENROUTER_API_KEY` en tu entorno o archivo `.env`.

### `features` {#features}

| Campo                | Flujo de trabajo | Descripción                                                       |
| -------------------- | ---------------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1                | Escanear la fuente en busca de `t("…")` y escribir/combinar `strings.json`.          |
| `translateUIStrings` | 1                | Traducir entradas de `strings.json` y escribir archivos JSON por locale. |
| `translateMarkdown`  | 2                | Traducir archivos `.md` / `.mdx`.                                   |
| `translateJSON`      | 2                | Traducir archivos de etiquetas JSON de Docusaurus.                            |

No hay una bandera `features.translateSVG`. Traducir activos SVG **independientes** con `translate-svg` y un bloque `svg` de nivel superior en la configuración. El comando `sync` ejecuta ese paso cuando `svg` está presente (a menos que `--no-svg`).

### `ui` {#ui}

| Campo                       | Descripción                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Directorios (relativos al cwd) escaneados para llamadas `t("…")`.               |
| `stringsJson`               | Ruta al archivo de catálogo maestro. Actualizado por `extract`.                  |
| `flatOutputDir`             | Directorio donde se escriben los archivos JSON por localidad (`de.json`, etc.).    |
| `preferredModel`            | Opcional. ID del modelo OpenRouter que se prueba primero para `translate-ui` solamente; luego `openrouter.translationModels` (o modelos heredados) en orden, sin duplicar este id. |
| `reactExtractor.funcNames`  | Nombres de funciones adicionales a escanear (predeterminado: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Extensiones de archivo a incluir (predeterminado: `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Cuando `true` (predeterminado), `extract` también incluye `package.json` `description` como una cadena de UI cuando está presente. |
| `reactExtractor.packageJsonPath` | Ruta personalizada al archivo `package.json` utilizado para esa extracción de descripción opcional. |

### `cacheDir` {#cachedir}

| Campo      | Descripción                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | Directorio de caché SQLite (compartido por todos los bloques de `documentations`). Reutilizable entre ejecuciones. |

### `documentations` {#documentations}

Array de bloques de pipeline de documentación. `translate-docs` y la fase de docs del proceso `sync` **cada** bloque en orden.

| Campo                                       | Descripción                                                                                                                                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | Nota opcional legible por humanos para este bloque (no se utiliza para la traducción). Prefijado en el encabezado `🌐` de `translate-docs` cuando está establecido; también se muestra en los encabezados de sección de `status`. |
| `contentPaths`                               | Fuentes Markdown/MDX para traducir (`translate-docs` escanea estos para `.md` / `.mdx`). Las etiquetas JSON provienen de `jsonSource` en el mismo bloque.                                                                                  |
| `outputDir`                                  | Directorio raíz para la salida traducida de este bloque.                                                                                                                                                                   |
| `sourceFiles`                                | Alias opcional fusionado en `contentPaths` al cargar.                                                                                                                                                                      |
| `targetLocales`                              | Subconjunto opcional de locales solo para este bloque (de lo contrario, locales raíz `targetLocales`). Los locales de documentación efectivos son la unión entre bloques.                                                      |
| `jsonSource`                                 | Directorio fuente para archivos de etiquetas JSON de Docusaurus para este bloque (por ejemplo, `"i18n/en"`).                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (predeterminado), `"docusaurus"`, o `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Raíz de documentos fuente para el diseño de Docusaurus (por ejemplo, `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Ruta de salida de markdown personalizada. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | Ruta de salida JSON personalizada para archivos de etiquetas. Soporta los mismos marcadores de posición que `pathTemplate`.                                                                                                                                      |
| `markdownOutput.flatPreserveRelativeDir`     | Para el estilo `flat`, mantener subdirectorios de origen para que los archivos con el mismo nombre base no colisionen.                                                                                                                                      |
| `markdownOutput.rewriteRelativeLinks` | Reescribir enlaces relativos después de la traducción (habilitado automáticamente para el estilo `flat`).                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | Raíz del repositorio utilizada al calcular los prefijos de reescritura de enlaces planos. Generalmente se deja como `"."` a menos que tus documentos traducidos vivan bajo una raíz de proyecto diferente. |
| `markdownOutput.postProcessing` | Transformaciones opcionales en el **cuerpo** del markdown traducido (se preserva el front matter YAML). Se ejecuta después de la reensamblaje de segmentos y la reescritura de enlaces planos, y antes de `injectTranslationMetadata`. |
| `markdownOutput.postProcessing.regexAdjustments` | Lista ordenada de `{ "description"?, "search", "replace" }`. `search` es un patrón regex (cadena simple usa la bandera `g`, o `/pattern/flags`). `replace` soporta marcadores de posición como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` (la misma idea que los `additional-adjustments` de referencia). |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — el traductor encuentra la primera línea que contiene `start` y la línea `end` correspondiente, luego reemplaza ese segmento con un conmutador de idiomas canónico. Los enlaces se construyen con rutas relativas al archivo traducido; las etiquetas provienen de `uiLanguagesPath` / `ui-languages.json` cuando están configuradas, de lo contrario, de `localeDisplayNames` y códigos de locales. |
| `injectTranslationMetadata`                  | Cuando `true` (predeterminado cuando se omite), los archivos markdown traducidos incluyen claves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Establecer en `false` para omitir. |

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

### `svg` (opcional) {#svg-optional}

Configuración de nivel superior para activos SVG independientes traducidos por `translate-svg` y la etapa SVG de `sync`.

| Campo                       | Descripción |
| --------------------------- | ----------- |
| `sourcePath`                | Un directorio o un array de directorios escaneados recursivamente en busca de archivos `.svg`. |
| `outputDir`                 | Directorio raíz para la salida SVG traducida. |
| `style`                     | `"plano"` o `"anidado"` cuando `pathTemplate` no está establecido. |
| `pathTemplate`              | Ruta de salida SVG personalizada. Marcadores de posición: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Texto traducido en minúsculas en la reensamblaje de SVG. Útil para diseños que dependen de etiquetas en minúsculas. |

### `glossary` {#glossary}

| Campo          | Descripción                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Ruta a `strings.json` - construye automáticamente un glosario a partir de traducciones existentes.                                                                                                                 |
| `userGlossary` | Ruta a un CSV con columnas `Cadena de idioma original` (o `en`), `localidad`, `Traducción` - una fila por término fuente y localidad objetivo (`localidad` puede ser `*` para todos los objetivos). |

La clave heredada `uiGlossaryFromStringsJson` todavía se acepta y se mapea a `uiGlossary` al cargar la configuración.

Generar un CSV de glosario vacío:

```bash
npx ai-i18n-tools glossary-generate
```

---

## Referencia de CLI {#cli-reference}

| Comando                                                                  | Descripción                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Escribe un archivo de configuración inicial (incluye `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` y `documentations[].injectTranslationMetadata`). `--with-translate-ignore` crea un archivo `.translate-ignore` inicial.                                                                            |
| `extract`                                                                 | Escanea la fuente en busca de llamadas a `t("…")` y actualiza `strings.json`. Requiere `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Traduce markdown/MDX y JSON para cada bloque de `documentations` (`contentPaths`, `jsonSource` opcional). `-j`: max locales paralelas; `-b`: max llamadas a la API por lotes paralelas por archivo. `--prompt-format`: formato de lote (`xml` \| `json-array` \| `json-object`). Consulta [Comportamiento de caché y banderas de `translate-docs`](#cache-behaviour-and-translate-docs-flags) y [Formato de solicitud por lotes](#batch-prompt-format). |
| `translate-svg …`                                                         | Traduce activos SVG independientes configurados en `config.svg` (separados de los documentos). Las mismas ideas de caché que los documentos; soporta `--no-cache` para omitir lecturas/escrituras de SQLite para esa ejecución. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | Traduce solo cadenas de la interfaz de usuario. `--force`: vuelve a traducir todas las entradas por locale (ignora traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a la API. `-j`: max locales paralelas. Requiere `features.translateUIStrings`.                                                                                 |
| `sync …`                                                                  | Extrae (si está habilitado), luego traducción de la interfaz de usuario, luego `translate-svg` cuando existe `config.svg`, luego traducción de documentación, a menos que se omita con `--no-ui`, `--no-svg` o `--no-docs`. Banderas compartidas: `-l`, `-p`, `--dry-run`, `-j`, `-b` (solo para agrupación de documentos), `--force` / `--force-update` (solo documentos; mutuamente excluyentes cuando se ejecutan documentos).                         |
| `status`                                                                  | Muestra el estado de traducción de markdown por archivo × locale (sin filtro `--locale`; los locales provienen de la configuración).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | Ejecuta primero `sync --force-update` (extraer, UI, SVG, documentos), luego elimina filas de segmentos obsoletas (null `last_hit_at` / ruta de archivo vacía); elimina filas de `file_tracking` cuya ruta de origen resuelta falta en el disco; elimina filas de traducción cuya metadata de `filepath` apunta a un archivo faltante. Registra tres conteos (obsoletas, huérfanas `file_tracking`, traducciones huérfanas). Crea una copia de seguridad de SQLite con marca de tiempo en el directorio de caché a menos que `--no-backup`. |
| `editor [-p <port>] [--no-open]`                                          | Inicia un editor web local para la caché, `strings.json` y CSV de glosario. `--no-open`: no abrir automáticamente el navegador predeterminado.<br><br>**Nota:** Si editas una entrada en el editor de caché, debes ejecutar un `sync --force-update` para reescribir los archivos de salida con la entrada de caché actualizada. Además, si el texto fuente cambia más tarde, la edición manual se perderá ya que se genera una nueva clave de caché. |
| `glossary-generate [-o <path>]`                                           | Escribe una plantilla vacía `glossary-user.csv`. `-o`: sobrescribir la ruta de salida (por defecto: `glossary.userGlossary` de la configuración, o `glossary-user.csv`).                                                                                                                                                |

Todos los comandos aceptan `-c <path>` para especificar un archivo de configuración no predeterminado, `-v` para salida detallada, y `-w` / `--write-logs [path]` para redirigir la salida de la consola a un archivo de registro (ruta predeterminada: bajo `cacheDir` en la raíz).

---

## Variables de entorno {#environment-variables}

| Variable               | Descripción                                               |
| ---------------------- | --------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Requerido.** Tu clave API de OpenRouter.                |
| `OPENROUTER_BASE_URL`  | Sobrescribir la URL base de la API.                      |
| `I18N_SOURCE_LOCALE`   | Sobrescribir `sourceLocale` en tiempo de ejecución.      |
| `I18N_TARGET_LOCALES`  | Códigos de locales separados por comas para sobrescribir `targetLocales`. |
| `I18N_LOG_LEVEL`       | Nivel del registrador (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Cuando `1`, deshabilitar colores ANSI en la salida del registro. |
| `I18N_LOG_SESSION_MAX` | Máximo de líneas mantenidas por sesión de registro (predeterminado `5000`). |
