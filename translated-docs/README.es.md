# herramientas-ai-i18n

Conjunto de herramientas CLI y programáticas para la internacionalización de aplicaciones y sitios de documentación en JavaScript/TypeScript. Extrae cadenas de la interfaz de usuario, las traduce con LLMs a través de OpenRouter y genera archivos JSON listos para la localidad para i18next, además de pipelines para markdown, JSON de Docusaurus y (a través de `translate-svg`) activos SVG independientes.

<small>**Leer en otros idiomas:** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## Dos flujos de trabajo principales

**Flujo de trabajo 1 - Traducción de UI** (React, Next.js, Node.js, cualquier proyecto i18next)

Escanea archivos fuente en busca de llamadas `t("…")`, construye un catálogo maestro (`strings.json` con metadatos **`models`** opcionales por localidad), traduce entradas faltantes por localidad a través de OpenRouter y escribe archivos JSON planos (`de.json`, `pt-BR.json`, …) listos para i18next.

**Flujo de trabajo 2 - Traducción de documentos** (Markdown, JSON de Docusaurus)

Traduce `.md` y `.mdx` de cada bloque de `documentaciones` en `contentPaths` y archivos de etiquetas JSON de la fuente `jsonSource` de ese bloque cuando está habilitado. Soporta diseños al estilo de Docusaurus y planos con sufijos de localidad por bloque (`documentaciones[].markdownOutput`). El directorio raíz compartido `cacheDir` contiene la caché de SQLite, por lo que solo se envían segmentos nuevos o cambiados al LLM. **SVG:** usa `translate-svg` con un bloque `svg` de nivel superior (también se ejecuta desde `sync` cuando se establece `svg`).

Ambos flujos de trabajo comparten un único archivo `ai-i18n-tools.config.json` y pueden usarse de forma independiente o conjunta. La traducción de SVG independiente se configura a través del bloque `svg` de nivel superior y se ejecuta a través de `translate-svg` (o la etapa SVG dentro de `sync`).

---

## Instalación

El paquete publicado es **solo ESM** (`"type": "module"`). Usa `import` desde Node.js, empaquetadores o `import()` — **`require('ai-i18n-tools')` no es compatible.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

Establece tu clave API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Inicio rápido

### Flujo de trabajo 1 - Cadenas de UI

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Conecta i18next en tu aplicación utilizando los ayudantes de `'ai-i18n-tools/runtime'`:

```js
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

### Flujo de trabajo 2 - Documentación

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### Ambos flujos de trabajo

```bash
npx ai-i18n-tools sync   # extract UI strings, then translate UI strings, optional standalone SVG, then docs
```

---

## Ayudantes de tiempo de ejecución

Exportados de `'ai-i18n-tools/runtime'` - funcionan en cualquier entorno JS, no se requiere importación de i18next:

| Ayudante | Descripción |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Opciones de inicialización estándar de i18next para configuraciones de clave como predeterminadas. |
| `wrapI18nWithKeyTrim(i18n)` | Envuelve `i18n.t` para que las claves se recorten antes de la búsqueda. |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fábrica para la carga asíncrona de archivos de localidad. |
| `getTextDirection(lng)` | Devuelve `'ltr'` o `'rtl'` para un código BCP-47. |
| `applyDirection(lng, element?)` | Establece el atributo `dir` en `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Etiqueta de visualización para una fila de menú de idioma (con i18n). |
| `getUILanguageLabelNative(lang)` | Etiqueta de visualización sin llamar a `t()` (estilo encabezado). |
| `interpolateTemplate(str, vars)` | Sustitución de bajo nivel `{{var}}` en una cadena simple (usado internamente; el código de la aplicación debe usar `t()` en su lugar). |
| `flipUiArrowsForRtl(text, isRtl)` | Invierte `→` a `←` para diseños RTL. |

---

## Comandos de CLI

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (requires config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools sync                                  Extract UI strings, then UI, optional SVG, then docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Todos los comandos aceptan `-c <config>` (predeterminado: `ai-i18n-tools.config.json`), `-v` (detallado), y opcionalmente `-w` / `--write-logs [ruta]` para añadir la salida de la consola a un archivo de registro (predeterminado: en el directorio de caché de traducción).

---

## Documentación

- [Introducción](docs/GETTING_STARTED.es.md) - guía completa de configuración para ambos flujos de trabajo, todas las banderas de CLI y referencia de campos de configuración.
- [Descripción del Paquete](docs/PACKAGE_OVERVIEW.es.md) - arquitectura, internos, API programática y puntos de extensión.
- [Contexto del Agente de IA](../docs/ai-i18n-tools-context.md) - contexto conciso del proyecto para agentes y mantenedores que realizan cambios en el código o la configuración.

---

## Licencia

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
