<a id="nextra-integration"></a>
# Integración de Nextra

Utilice `init -t ui-nextra` y `docsOutput.style: "nextra"` para sitios de documentación de [Nextra](https://nextra.site/) 4 en Next.js App Router. El preajuste es un alias para `doc-system` con un `localeSubpath` vacío y los nombres de carpeta de configuración regional BCP-47 conservados (`localePathLowercase` por defecto es `false`, por lo que las carpetas permanecen `pt-BR`, `zh-Hans`, etc.).

Consulte también [Documentos](/es/guide/documents/) y la demostración ejecutable [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).

<a id="quick-start"></a>
## Inicio rápido

```bash
ai-i18n-tools init -t ui-nextra -P gemini
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Habilite `features.translateDocs` cuando traduzca el contenido de la página, las etiquetas de la barra lateral de `_meta.ts` y los módulos del diccionario de temas en una ejecución de `sync`.

<a id="page-layout"></a>
## Diseño de página

Nextra 4 con i18n mantiene el **MDX de la configuración regional de origen en una carpeta de configuración regional** (normalmente `content/en/` cuando el inglés es el origen). `sourceLocale` puede ser cualquier idioma. Las copias traducidas se escriben en carpetas de configuración regional hermanas:

```text
content/en/index.mdx              →  content/pt-BR/index.mdx
content/en/guide/getting-started.mdx  →  content/zh-Hans/guide/getting-started.mdx
```

Configure un bloque `docs[]`:

```json
{
  "contentPaths": ["content/en"],
  "outputDir": "content",
  "docsOutput": {
    "style": "nextra",
    "docsRoot": "content/en",
    "rewriteNextraLinks": true
  }
}
```

Apunte `contentPaths` a los archivos y directorios `.mdx` escritos en `sourceLocale`. Ese idioma puede ser cualquier idioma. Establezca `docsRoot` en la carpeta de configuración regional de origen dentro de `content/` (por ejemplo, `content/en` cuando el inglés es el origen).

Conecte la [internacionalización](https://nextra.site/docs/guide/i18n) de Nextra: configure `i18n.locales` y `defaultLocale` en `next.config`, y mantenga `targetLocales` en `ai-i18n-tools.config.json` alineado con esos códigos de configuración regional y los nombres de carpeta de `content/{locale}/`.

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n en un sitio existente

Un sitio Nextra 4 solo en inglés necesita una carpeta de configuración regional, un parámetro de ruta y la configuración i18n de Next.js antes de que `translate-docs` tenga dónde escribir. El [diccionario de indicaciones](#agent-prompt-dictionary-and-routes) hace esto en una sola pasada. Lista de verificación:

- Mover MDX a `content/en/` (el inglés es una carpeta de configuración regional, no la raíz del contenido).
- `i18n.locales` y `defaultLocale` en `next.config`.
- Una ruta `app/[lang]/`, `getPageMap('/${lang}')` y `<Layout i18n={…}>`.
- `app/_dictionaries/en.ts` más `get-dictionary.ts`, pasados a `<Layout>`, `<Navbar>` y `<Footer>`.
- `proxy.ts` opcional que reexporta `nextra/locales` (consulte [Proxy de configuración regional opcional](#optional-locale-proxy)).
- `targetLocales` alineado con esos códigos de configuración regional, luego `sync`.

<a id="theme-strings"></a>
## Cadenas de tema

El "chrome" del tema de Nextra (`editLink`, marcador de posición de búsqueda, pie de página, etc.) no se extrae de markdown. Cree cadenas en inglés en un módulo de diccionario TypeScript (por ejemplo, `app/_dictionaries/en.ts`) y tradúzcalo dentro de **`translate-docs`**:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/en"],
      "outputDir": "content",
      "nextraDictionaryPath": "app/_dictionaries/en.ts",
      "docsOutput": {
        "style": "nextra",
        "docsRoot": "content/en"
      }
    }
  ]
}
```

La herramienta escribe `app/_dictionaries/{locale}.ts` (plantilla predeterminada: `{dir}/{locale}.ts`). Cargue el módulo por configuración regional en `app/_dictionaries/get-dictionary.ts` y pase las cadenas traducidas a `<Layout>`, `<Search>`, `<Footer>` y los componentes de tema relacionados.

**No** use `json[]` para las cadenas del diccionario de temas de Nextra; ese patrón es solo para paquetes de configuración regional de aplicaciones no relacionados.

<a id="sidebar-labels-_metats"></a>
## Etiquetas de la barra lateral (`_meta.ts`)

Nextra 3+ utiliza archivos TypeScript `_meta.ts` / `_meta.tsx` para la estructura y los títulos de la barra lateral. Cuando `docsOutput.style` es `"nextra"`, **`translate-docs`** recopila automáticamente `_meta.ts`, `_meta.tsx` y `_meta.js` bajo `docsRoot`, traduce los literales de cadena en el mapa meta de `export default { … }` y escribe archivos duplicados bajo `content/{locale}/**`.

**Patrón recomendado:** mantenga los literales en inglés en línea en `content/en/**/_meta.ts` (igual que [swr-site](https://github.com/shuding/nextra/tree/main/examples/swr-site)):

```text
content/en/_meta.ts           English sidebar labels (source)
content/pt-BR/_meta.ts        Translated copy (generated by translate-docs)
```

Opcional: anule la recopilación con `docs[].nextraMetaGlob` o restrinja los nombres de propiedades traducibles con `docs[].nextraMetaTranslatableKeys` (predeterminado: `title`, `display`, `breadcrumb`).

**No** cree manualmente sidecars JSON (`i18n/meta.en.json`) o archivos `_meta.ts` delgados que importen JSON traducido; regenere los archivos `_meta` de configuración regional con `sync` / `translate-docs` cuando el inglés cambie.

<a id="example-project"></a>
## Proyecto de ejemplo

[examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) — Fuentes en inglés en `content/en/`, árboles de páginas `pt-BR` y `zh-Hans` confirmados, archivos `_meta.ts` en línea y `app/_dictionaries/{locale}.ts`. Un componente de servidor (`app/_components/feedback-links.tsx`) usa `t()` a través de una búsqueda de paquete plano para que el cromo personalizado pueda estar junto al diccionario. Ejecute `pnpm run dev` en el puerto 3070.

<a id="agent-prompt-dictionary-and-routes"></a>
## Prompt del agente: diccionario y rutas

Use esto cuando el sitio todavía tenga cadenas de diseño codificadas y ningún árbol `content/en/`. Sigue la ruta predeterminada (diccionario + `_meta.ts` + `translate-docs`). No introduce `t()`.

<details class="agent-prompt">
<summary>Indicación de diccionario y rutas</summary>

````markdown
# Add Nextra 4 i18n with a theme dictionary

## Context

ai-i18n-tools translates Nextra page bodies, `_meta.ts` object literals, and the
theme dictionary module (`nextraDictionaryPath`, usually
`app/_dictionaries/en.ts`) with `translate-docs`. The English sentence in that
dictionary is the source text. Do not translate strings yourself. Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit `next.config`, `app/[lang]/layout.tsx`, `app/_dictionaries/en.ts`,
`app/_dictionaries/get-dictionary.ts`, and move MDX under `content/en/`. Skip
`docsRepositoryBase` (a URL). Keep native language names in a `LOCALE_LABELS`
map untranslated (`English`, `Português (Brasil)`). Do not move `_meta.ts`
sidebar labels into the dictionary or into `t()`.

## Call shape

- `next.config`: `i18n.locales` and `defaultLocale`.
- English MDX and `_meta.ts` live under `content/en/`. `getPageMap('/${lang}')`
  loads the matching tree.
- `app/_dictionaries/en.ts` exports the English chrome (`siteTitle`, `footer`,
  `editLink`, search placeholder, table-of-contents title, last-updated label).
  `get-dictionary.ts` dynamically imports `./${locale}`.
- Pass those fields into `<Layout>`, `<Navbar>`, and `<Footer>`. Set
  `<Layout i18n>` from `LOCALE_LABELS`.
- Config: `features.translateDocs`, `docsOutput.style: "nextra"`,
  `docsRoot: "content/en"`, `nextraDictionaryPath: "app/_dictionaries/en.ts"`.
  `targetLocales` matches `i18n.locales` except the default locale.

## Order

1. Route, config, and dictionary wiring.
2. Move existing MDX into `content/en/` and point `contentPaths` at that folder.
3. Ask the user to run `sync`. Do not write `app/_dictionaries/pt-BR.ts` or
   `content/pt-BR/` by hand.

## Do not

- Do not translate, rename, or reword the English dictionary strings.
- Do not add `t()`, `getRequestConfig`, or a `dictionary.ts` filename. The
  English module is `app/_dictionaries/en.ts`.
- Do not duplicate a string in both the dictionary and a later `t()` call.
- Do not hand-edit generated locale dictionaries or locale `_meta.ts` files.

## Verify

- `pnpm build` passes.
- `/` shows the English dictionary strings. After `sync`, one non-English route
  shows translated chrome and page titles.
- Sidebar labels come from `content/en/**/_meta.ts`, not from the dictionary.

## Report back

List files changed, each layout string you left untranslated and why (URLs,
native language names), and any MDX you were not sure belonged under
`content/en/`.
````

</details>

<a id="optional-t-for-app-react-hybrid"></a>
## Opcional: `t()` para `app/` React (híbrido)

**Predeterminado:** los literales de objeto `_meta.ts` y `app/_dictionaries/en.ts` son traducidos por `translate-docs`. No se requiere `t()` para ese cromo.

**Híbrido opcional:** los componentes de servidor personalizados pueden llamar a `t("source sentence")` y `translate-ui`. La frase está escrita en `sourceLocale`, que puede ser cualquier idioma. No copie cadenas de diccionario ni títulos `_meta.ts` en esas llamadas. `extract` solo ve literales dentro de `t()`, por lo que `ui.sourceRoots` debe listar solo las carpetas que contienen esas llamadas (el ejemplo usa `app/_components`), no `app/_dictionaries`.

Un singleton i18next a nivel de módulo con `changeLanguage` no es seguro en un componente de servidor: las solicitudes concurrentes lo comparten. El ejemplo usa una búsqueda sin estado en su lugar. `getT(lang)` carga `locales/{lang}.json` para una configuración regional de destino, trata la ruta de origen como un paquete vacío (el literal en inglés ya es el texto) e interpola con `interpolateTemplate` de `ai-i18n-tools/runtime`. Los marcadores de posición son <code v-pre>{{name}}</code> con claves de palabras ASCII. Esta es la misma idea que [examples/astro-website/src/i18n/t.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-website/src/i18n/t.ts).

Esa búsqueda no selecciona formas plurales. Un componente que necesita `plurals: true` debe usar la ruta i18next de [Wire i18next](/es/guide/ui-strings/i18next-runtime) en un componente de cliente, o un `createInstance()` por solicitud.

Configuración para el híbrido, junto al bloque de documentos existente:

- `features.translateUIStrings`
- `ui.sourceRoots` — carpetas que contienen llamadas a `t()`
- `ui.stringsJson`
- `ui.flatOutputDir`

El `sourceLocale` del ejemplo es `en-GB` y la ruta del sitio es `en`. Con la búsqueda sin estado, la ruta `en` no necesita un paquete, por lo que esa discrepancia no importa. Solo importa si cambia este componente al arranque de i18next, que clavea los paquetes por `sourceLocale`.

| Contenido | Canalización predeterminada | Alternativa opcional |
|---------|------------------|----------------------|
| Cuerpos de página MDX | `translate-docs` | — |
| Títulos de objeto `_meta.ts` / `_meta.tsx` | `translate-docs` | refactorizar a `t()` en JSX (híbrido) |
| Diseño `app/`, `_components/` | `nextraDictionaryPath` + diccionario `.ts` | `t()` + `translate-ui` |

Consulte `app/_components/feedback-links.tsx` y `lib/ui-t.ts` en [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/). `pnpm run i18n:sync-ui` en ese ejemplo ejecuta la extracción y `translate-ui` sin tocar la canalización de documentos.

**Ejemplo de indicación de agente de IA** (copie en Cursor u otro agente de codificación al agregar `t()` junto al diccionario):

<details class="agent-prompt">
<summary>Indicación de t() híbrido</summary>

````markdown
# Add a stateless t() lookup to a Nextra 4 server component

## Context

MDX pages, `_meta.ts`, and `app/_dictionaries/en.ts` stay on `translate-docs`.
Do not duplicate those strings in `t()`. This task adds `t("source sentence")`
only in custom components that the dictionary does not cover. The literal is the
catalog key and is written in `sourceLocale`, which can be any language. Do not translate any string.

Follow `lib/ui-t.ts` and `app/_components/feedback-links.tsx` in
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs

## Scope

Edit the named components and `ai-i18n-tools.config.json`. Do not edit
`app/_dictionaries`, `content/**/_meta.ts`, or generated locale trees. Skip
URLs, native language names, and `docsRepositoryBase`.

## Call shape

Create `lib/ui-t.ts`. `getT(lang)` loads `locales/{lang}.json` through a
dynamic-import map for target locales, uses an empty bundle for the source
route, and returns
`(source, vars) => interpolateTemplate(flat[source] ?? source, vars ?? {})` with
`interpolateTemplate` imported from `ai-i18n-tools/runtime`.

Replace hardcoded sentences in the named server components with `t("source sentence")`. The sentence is written in `sourceLocale`, which can be any language.
A placeholder is `t("You are reading {{page}}.", { page })`.

Do not use `getRequestConfig` (that is a next-intl API) and do not call
`changeLanguage` on a shared i18next instance. This lookup does not resolve
plurals. Leave plural copy on the i18next client path.

Set `features.translateUIStrings`, `ui.sourceRoots` to only the folders that
contain `t()` calls, `ui.stringsJson`, and `ui.flatOutputDir`.

## Order

1. Add `lib/ui-t.ts` and the `t()` calls.
2. Set the four `ui` config keys.
3. Run `ai-i18n-tools extract` (or `sync-ui`). Do not hand-write
   `locales/*.json`.

## Do not

- Do not translate, rename, or reword the source sentences.
- Do not put `t()` keys in `app/_dictionaries` or move `_meta.ts` titles into
  `t()`.
- Do not hand-edit `strings.json` or flat locale files.
- Do not change layout or Nextra theme props that already receive dictionary
  strings.

## Verify

- `extract` writes a non-empty catalog containing the new sentences and nothing
  from the dictionary.
- The project build passes.
- The source route still shows the English sentences. After `translate-ui`, one
  non-English route renders the translated component.

## Report back

List files changed, each string you left in the dictionary on purpose, and any
plural or server-concurrency case you did not convert.
````

</details>

<a id="link-conventions"></a>
## Convenciones de enlaces

Nextra sirve rutas con prefijo de configuración regional a través de Next.js `i18n` (`/guide/getting-started`, `/pt-BR/guide/getting-started`). **Los enlaces dentro de la página deben permanecer neutrales a la configuración regional** (`/guide/getting-started`) para que Next.js pueda prefijar la configuración regional activa automáticamente.

Habilite el normalizador incorporado para que `translate-docs` corrija los enlaces en cada archivo traducido automáticamente:

```json
"docsOutput": {
  "style": "nextra",
  "docsRoot": "content/en",
  "rewriteNextraLinks": true
}
```

`rewriteNextraLinks` se habilita de forma predeterminada cuando `style` es `"nextra"`.

| Autor en la configuración regional de origen | Después del normalizador |
|--------------------------|------------------|
| `[Guide](content/en/guide/getting-started.mdx)` | `[Guide](/es/guide/getting-started)` |
| `[Guide](/es/guide/getting-started.mdx)` | `[Guide](/es/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | sin cambios (URL completa) |

**Reglas de autoría**

- Enlaces de documentos entre páginas: use **rutas de sitio neutrales a la configuración regional** (`/guide/…`) en MDX en inglés, o rutas `content/en/…` / `.mdx` relativas y deje que el normalizador las reescriba durante `sync`.
- Archivos de repositorio fuera del árbol de contenido: use **URL completas**.
- **No** edite manualmente los enlaces en `content/<locale>/` — regenere con `sync` / `translate-docs`.

<a id="optional-locale-proxy"></a>
## Proxy de configuración regional opcional

Nextra proporciona un proxy de detección de configuración regional para sitios i18n. Exporte desde `proxy.ts` en la raíz de su proyecto:

```ts
export { proxy } from 'nextra/locales'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)',
  ],
}
```

**Códigos de configuración regional del sitio vs `sourceLocale`:** Nextra y Next.js usan códigos de ruta cortos (`en`, `pt-BR`, `zh-Hans`) en `next.config`, `content/{locale}/` y la cookie `NEXT_LOCALE`. `sourceLocale` en `ai-i18n-tools.config.json` puede ser una etiqueta BCP-47 como `en-GB` para la calidad de la traducción — esa etiqueta **no** es una ruta del sitio. Si la cookie del navegador o `Accept-Language` se resuelve en una etiqueta fuera de `i18n.locales` (por ejemplo, `en-GB` cuando solo `en` está configurado), el proxy estándar de Nextra puede redirigir en un bucle. La demostración [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/) envuelve `nextra/locales` para restablecer las cookies y rutas no válidas a la configuración regional predeterminada del sitio antes de delegar.

Esto no funciona con las exportaciones estáticas de `output: 'export'`. Consulte [Documentación de Nextra i18n](https://nextra.site/docs/guide/i18n).

Consulte también [Configuración — `docsOutput`](/es/reference/configuration#docsoutput) y [Diseños de salida](/es/guide/documents/output-layouts).
