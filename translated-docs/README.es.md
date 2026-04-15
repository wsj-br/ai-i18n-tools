# herramientas-ai-i18n

Kit de herramientas CLI y programático para internacionalizar aplicaciones y sitios de documentación en JavaScript/TypeScript. Extrae cadenas de interfaz de usuario, las traduce con modelos de lenguaje grande (LLM) a través de OpenRouter y genera archivos JSON listos para cada idioma para i18next, además de pipelines para markdown, JSON de Docusaurus y (mediante `features.translateSVG`, `translate-svg` y el bloque `svg`) activos SVG independientes.

<small>**Leer en otros idiomas:** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## Dos flujos de trabajo principales

**Flujo de trabajo 1 - Traducción de UI** (React, Next.js, Node.js, cualquier proyecto i18next)

Crea un catálogo maestro (`strings.json` con metadatos opcionales por configuración regional **`models`**) a partir de literales **`t("…")` / `i18n.t("…")`**, opcionalmente **`package.json` `description`**, y opcionalmente cada **`englishName`** desde `ui-languages.json` cuando esté habilitado en la configuración. Traduce las entradas faltantes por configuración regional mediante OpenRouter y genera archivos JSON planos (`de.json`, `pt-BR.json`, …) listos para i18next.

**Flujo de trabajo 2 - Traducción de documentos** (Markdown, JSON de Docusaurus)

Traduce archivos `.md` y `.mdx` desde los `contentPaths` de cada bloque `documentations` y archivos JSON de etiquetas desde el `jsonSource` de ese bloque cuando está habilitado. Admite diseños con sufijo de idioma estilo Docusaurus y planos por bloque (`documentations[].markdownOutput`). El `cacheDir` raíz compartido contiene la caché SQLite para que solo se envíen al LLM segmentos nuevos o modificados. **SVG:** habilite `features.translateSVG`, agregue el bloque `svg` de nivel superior, luego use `translate-svg` (también se ejecuta desde `sync` cuando ambos están configurados).

Ambos flujos de trabajo comparten un único archivo `ai-i18n-tools.config.json` y pueden usarse de forma independiente o conjunta. La traducción independiente de SVG utiliza `features.translateSVG` junto con el bloque `svg` de nivel superior y se ejecuta mediante `translate-svg` (o la etapa SVG dentro de `sync`).

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

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
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
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
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
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Opciones globales en cada comando: `-c <config>` (predeterminado: `ai-i18n-tools.config.json`), `-v` (detallado), opcional `-w` / `--write-logs [path]` para duplicar la salida de la consola en un archivo de registro (predeterminado: dentro del directorio de caché de traducciones), `-V` / `--version`, y `-h` / `--help`. Consulte [Introducción](docs/GETTING_STARTED.es.md#cli-reference) para obtener las banderas específicas de cada comando.

---

## Documentación

- [Introducción](docs/GETTING_STARTED.es.md) - guía completa de configuración para ambos flujos de trabajo, referencia de la CLI y referencia de campos de configuración.
- [Descripción general del paquete](docs/PACKAGE_OVERVIEW.es.md) - arquitectura, componentes internos, API programática y puntos de extensión.
- [Contexto del agente de IA](../docs/ai-i18n-tools-context.md) - **para aplicaciones que usan el paquete:** indicaciones de integración para proyectos secundarios (cópielas en las reglas del agente de su repositorio).
- Contenido interno para el mantenimiento de **este** repositorio: `dev/package-context.md` (solo clonación; no disponible en npm).

---

## Licencia

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
