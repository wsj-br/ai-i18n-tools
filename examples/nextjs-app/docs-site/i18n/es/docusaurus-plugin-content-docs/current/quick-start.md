---
sidebar_position: 2
title: Inicio rápido
description: >-
  Obtén tu primer documento traducido en menos de cinco minutos utilizando
  ai-i18n-tools con este proyecto de ejemplo de Next.js.
translation_last_updated: '2026-07-10T21:34:19.338Z'
source_file_mtime: '2026-05-04T22:22:41.000Z'
source_file_hash: bfe5380d21559e2ebd12913020cd7a9e50b1e85a76bc4436c438e90e9c09e1cf
translation_language: es
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Sigue los pasos a continuación para ejecutar tu primera traducción con `ai-i18n-tools`. Esta guía utiliza el proyecto de ejemplo de Next.js que ya estás leyendo; todos los comandos deben ejecutarse desde el directorio `examples/nextjs-app/`.

---

## Requisitos previos {#prerequisites}

Antes de comenzar, asegúrate de tener lo siguiente:

- **Node.js 22.16+** — comprueba con `node --version`
- **Una clave API de OpenRouter** — regístrate en [openrouter.ai](https://openrouter.ai) y copia tu clave desde el panel
- **pnpm 10.33+** — comprueba con `pnpm --version`

---

## Paso 1 — Instalar las dependencias {#step-1--install-dependencies}

```bash
cd examples/nextjs-app
pnpm install
```

Esto instala `ai-i18n-tools` junto con los paquetes de Next.js y Docusaurus utilizados en este ejemplo.

---

## Paso 2 — Establecer tu clave API {#step-2--set-your-api-key}

Crea un archivo `.env` en el directorio `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lee esta variable automáticamente. Nunca confirmes `.env` en el control de versiones.

---

## Paso 3 — Revisar la configuración {#step-3--review-the-configuration}

Abre `ai-i18n-tools.config.json`. La sección relevante para la traducción de documentación es esta:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
    "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": true
  },
  "glossary": {
    "uiGlossary": "locales/strings.json",
    "userGlossary": "glossary-user.csv",
    "autoAddUserEditedToGlossary": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in docs-site static assets",
              "search": "screenshots/es/",
              "replace": "screenshots/${translatedLocale}/"
            }
          ]
        }
      }
    },
    {
      "description": "Root README only (flat markdown output)",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders under translated-docs",
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
    }
  ],
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

El array `contentPaths` indica a la herramienta qué directorios (o archivos individuales) traducir. El `outputDir` es donde se escriben los archivos traducidos.

---

## Paso 4 — Ejecutar la sincronización {#step-4--run-the-sync}

Traduce solo la documentación (por ahora omite cadenas de interfaz y archivos SVG):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Verás una salida similar a esta:

```text
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

En la segunda ejecución, la mayoría de los segmentos serán **aciertos en caché** y la traducción se completará en menos de un segundo.

---

## Paso 5 — Inspeccionar la salida {#step-5--inspect-the-output}

Los archivos traducidos se escriben en `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. Abre uno para compararlo con el original:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Elementos clave a verificar:

- Los bloques de código son **idénticos** al origen: no se tradujo ningún código.
- Los valores del front matter (`title`, `description`) se traducen.
- Los `code spans` en línea dentro del texto se conservan textualmente.
- Los enlaces mantienen su `href` original; solo cambia el texto del enlace.

---

## Paso 6 — Iniciar Docusaurus {#step-6--start-docusaurus}

```bash
cd docs-site
pnpm start -- --locale de
```

Esto inicia el servidor de desarrollo de Docusaurus en alemán. Abra [http://localhost:3040/de/](http://localhost:3040/de/) en su navegador para navegar por la documentación traducida.

---

## Paso 7 — Explorar la demo de Next.js (idioma + plurales cardinales) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

La traducción de documentación en este tutorial utiliza **solo Markdown**. El mismo repositorio de ejemplo también incluye una interfaz de **Next.js** en el puerto **3030**, donde puedes ver llamadas `t()`, URLs `?locale=` y una demostración de **plurales cardinales**.

Desde `examples/nextjs-app/`:

```bash
pnpm dev
```

Luego abre [http://localhost:3030](http://localhost:3030).

- Cambia los idiomas con el menú desplegable **Locale**, o añade `?locale=<code>` (por ejemplo, `http://localhost:3030/?locale=ar`). La interfaz mantiene sincronizados la cadena de consulta y el menú desplegable.
- Desplázate hasta **Plurales: ejemplo de uso de generación automática**. La página repite "Esta página tiene ... secciones" para cantidades de ejemplo fijas (**1**, **2**, **5**, **50**) para que puedas comparar las reglas de plural entre configuraciones regionales (incluyendo idiomas con múltiples formas plurales).
- Las llamadas usan `t("…", { plurals: true, count })`. Con `extract` / `translate-ui`, esa clave se convierte en un grupo plural en `locales/strings.json`; los archivos planos `public/locales/*.json` contienen las formas con sufijos. La conexión en tiempo de ejecución está en `src/lib/i18n.ts` — consulta la sección **Cardinal plurals example** en el [ejemplo README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) para una explicación concisa.

---

## Qué explorar a continuación {#what-to-explore-next}

- Lee el [Translation Feature Showcase](./feature-showcase) para ver cada elemento de Markdown que puede manejar `ai-i18n-tools`, incluyendo cómo se relacionan las **cadenas de interfaz de plurales cardinales** con esta canalización de documentación.
- Edita una oración en `docs-site/docs/feature-showcase.md` y vuelve a ejecutar `sync`: solo ese segmento se enviará al LLM; el resto se servirá desde la caché.
- Añade un término a `glossary-user.csv` para garantizar una terminología consistente en todos los idiomas.
- Habilita la canalización de cadenas de interfaz estableciendo `"translateUIStrings": true` y ejecutando `sync` sin la bandera `--no-ui`.
