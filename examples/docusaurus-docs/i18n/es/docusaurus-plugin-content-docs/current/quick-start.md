---
sidebar_position: 2
title: Inicio rápido
description: >-
  Obtenga su primer documento traducido en menos de cinco minutos usando
  ai-i18n-tools con este proyecto de ejemplo de Docusaurus.
translation_last_updated: '2026-07-10T22:46:22.074Z'
source_file_mtime: '2026-07-10T22:43:30.778Z'
source_file_hash: 3ce439245e1bfdd2c280cc6ce7d3250ef27a14c7ae4756eae5f6e6b4e20a67c1
translation_language: es
source_file_path: docs/quick-start.md
translation_models:
  - google/gemini-2.5-flash
---



Siga los pasos a continuación para ejecutar su primera traducción con `ai-i18n-tools`. Esta guía utiliza el ejemplo de Docusaurus que ya está leyendo; cada comando debe ejecutarse desde el directorio `examples/docusaurus-docs/`.

---

## Requisitos previos {#prerequisites}

Antes de comenzar, asegúrese de tener lo siguiente:

- **Node.js 22.16+** — verifique con `node --version`
- **Una clave de API de OpenRouter** — regístrese en [openrouter.ai](https://openrouter.ai) y copie su clave desde el panel de control
- **pnpm 10.33+** — verifique con `pnpm --version`

---

## Paso 1 — Instalar dependencias {#step-1--install-dependencies}

```bash
cd examples/docusaurus-docs
pnpm install
```

Esto instala `ai-i18n-tools` junto con los paquetes de Docusaurus utilizados por este ejemplo.

---

## Paso 2 — Establecer su clave de API {#step-2--set-your-api-key}

Cree un archivo `.env` en el directorio `examples/docusaurus-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lee esta variable automáticamente. Nunca confirme `.env` al control de versiones.

---

## Paso 3 — Revisar la configuración {#step-3--review-the-configuration}

Abra `ai-i18n-tools.config.json`. La sección relevante para la traducción de la documentación se ve así:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus docs and shell JSON catalogs",
      "contentPaths": ["docs/"],
      "outputDir": "i18n",
      "docusaurusCatalogDir": "i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in static assets",
              "search": "screenshots/es/]+/",
              "replace": "screenshots/es/"
            }
          ]
        }
      }
    }
  ]
}
```

La matriz `contentPaths` le dice a la herramienta qué directorios (o archivos individuales) traducir. El `outputDir` es donde se escriben los archivos traducidos.

---

## Paso 4 — Ejecutar la sincronización {#step-4--run-the-sync}

Traduzca la documentación y el JSON de shell de Docusaurus:

```bash
pnpm run i18n:sync
```

Verá una salida similar a:

```text
[docs] Scanning docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

En la segunda ejecución, la mayoría de los segmentos serán **aciertos de caché** y la traducción se completará en menos de un segundo.

---

## Paso 5 — Inspeccionar la salida {#step-5--inspect-the-output}

Los archivos traducidos se escriben en `i18n/<locale>/docusaurus-plugin-content-docs/current/`. Abra uno para compararlo con la fuente:

```bash
# Compare Spanish translation with English source
diff docs/quick-start.md \
     i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Aspectos clave a verificar:

- Los bloques de código son **idénticos** a la fuente; no se tradujo ningún código.
- Los valores de "front matter" (`title`, `description`) están traducidos.
- Los `code spans` en línea dentro del texto se conservan literalmente.
- Los enlaces mantienen su `href` original; solo cambia el texto ancla.

---

## Paso 6 — Iniciar Docusaurus {#step-6--start-docusaurus}

```bash
pnpm run start:de
```

Esto inicia el servidor de desarrollo de Docusaurus en alemán. Abre [http://localhost:3100/de/quick-start](http://localhost:3100/de/quick-start) en tu navegador para explorar la documentación traducida.

Después de una compilación de producción (`pnpm build` y luego `pnpm preview`), cada "locale" está disponible sin reiniciar el servidor de desarrollo por "locale".

---

## Qué explorar a continuación {#what-to-explore-next}

- Lee la [Demostración de características de traducción](./feature-showcase) para ver cada elemento de Markdown que `ai-i18n-tools` puede manejar.
- Edita una frase en `docs/feature-showcase.md` y vuelve a ejecutar `pnpm run i18n:sync`: solo ese segmento se enviará al LLM; el resto se servirán desde la caché.
- Añade un término a `glossary-user.csv` para asegurar una terminología consistente en todos los "locales".
- Para cadenas de interfaz de usuario, plurales cardinales, traducción de SVG y un README plano en el mismo repositorio, consulta el [ejemplo de Next.js](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) combinado.
