---
title: Inicio rápido
description: >-
  Obtén tu primer documento traducido en menos de cinco minutos usando
  ai-i18n-tools con este ejemplo de Astro Starlight.
sidebar:
  order: 2
translation_last_updated: '2026-05-24T01:01:41.067Z'
source_file_mtime: '2026-05-22T21:44:09.987Z'
source_file_hash: 2e7e3283a7dc1df486ce3088aa4f1bec3dac1bbce14d43f8d513a52fb0cd1cd9
translation_language: es
source_file_path: src/content/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Siga los pasos a continuación para ejecutar su primera traducción con `ai-i18n-tools`. Esta guía utiliza el ejemplo de Starlight que está leyendo — cada comando debe ejecutarse desde el directorio `examples/astro-docs/`.

---

<a id="prerequisites"></a>

## Requisitos previos
Antes de comenzar, asegúrese de tener lo siguiente:

- **Node.js 22.16+** — verifique con `node --version`
- **Una clave API de OpenRouter** — regístrese en [openrouter.ai](https://openrouter.ai) y copie su clave desde el panel
- **pnpm 10.33+** — verifique con `pnpm --version`

---

<a id="step-1--install-dependencies"></a>

## Paso 1 — Instalar dependencias

```bash
cd examples/astro-docs
pnpm install
```

Esto instala `ai-i18n-tools` (a través del espacio de trabajo) junto con Astro y Starlight.

---

<a id="step-2--set-your-api-key"></a>

## Paso 2 — Establezca su clave API
Cree un archivo `.env` en el directorio `examples/astro-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lee esta variable automáticamente. Nunca confirme `.env` en el control de versiones.

---

<a id="step-3--review-the-configuration"></a>

## Paso 3 — Revise la configuración
Abra `ai-i18n-tools.config.json`. La sección relevante para la traducción de documentación es esta:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": false
  },
  "documentations": [
    {
      "description": "Starlight docs under src/content/docs",
      "contentPaths": [
        "src/content/docs/quick-start.md",
        "src/content/docs/feature-showcase.mdx"
      ],
      "outputDir": "src/content/docs",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "astro-starlight",
        "docsRoot": "src/content/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in public assets",
              "search": "screenshots/es/",
              "replace": "screenshots/es/"
            }
          ]
        }
      }
    }
  ]
}
```

El array `contentPaths` indica al herramienta qué archivos traducir. Las copias traducidas se escriben en `src/content/docs/<locale>/` (carpetas de idioma de Starlight).

---

<a id="step-4--run-the-sync"></a>

## Paso 4 — Ejecute la sincronización
Traduzca la documentación:

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Verá una salida similar a esta:

```text
[docs] Scanning src/content/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.mdx — segments translated (5 locales)
[docs] quick-start.md — segments translated (5 locales)
```

En la segunda ejecución, la mayoría de los segmentos serán **aciertos de caché** y la traducción se completará rápidamente.

---

<a id="step-5--inspect-the-output"></a>

## Paso 5 — Inspeccione la salida
Los archivos traducidos se escriben en `src/content/docs/<locale>/`. Abra uno para compararlo con el origen:

```bash
# Compare Spanish translation with English source
diff src/content/docs/quick-start.md \
     src/content/docs/es/quick-start.mdx
```

Aspectos clave a verificar:

- Los bloques de código son **idénticos** al origen: no se tradujo ningún código.
- Los valores del front matter (`title`, `description`) se traducen.
- Los elementos `code spans` en línea dentro del texto se conservan textualmente.
- Los enlaces mantienen su `href` original; solo cambia el texto del enlace.

---

<a id="step-6--start-starlight"></a>

## Paso 6 — Iniciar Starlight

```bash
pnpm dev
```

Abre [http://localhost:3050/de/quick-start](http://localhost:3050/de/quick-start) (o selecciona una configuración regional desde el selector de idioma) para navegar por la documentación traducida.

---

<a id="step-7--explore-the-nextjs-demo-locale--cardinal-plurals"></a>

## Paso 7 — Explorar la demo de Next.js (configuración regional + plurales cardinales)
La traducción de documentación en este tutorial utiliza únicamente **Markdown**. El repositorio también incluye una interfaz de **Next.js** en `examples/nextjs-app/` en el puerto **3030**, donde puedes ver llamadas a `t()`, URLs con `?locale=` y una demostración de **plurales cardinales**.

```bash
cd ../nextjs-app
pnpm dev
```

Luego abre [http://localhost:3030](http://localhost:3030).

- Cambia de idioma mediante el menú desplegable **Locale** o añade `?locale=<code>` (por ejemplo, `http://localhost:3030/?locale=ar`).
- Desplázate hasta **Plurals: automatic generation usage example** y compara las reglas de plural entre distintas configuraciones regionales.
- Consulta la sección **Cardinal plurals example** en el [README del ejemplo de Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

<a id="what-to-explore-next"></a>

## Qué explorar a continuación
- Lee la [muestra de funciones de traducción](./feature-showcase) para ver cada elemento Markdown que puede manejar `ai-i18n-tools`.
- Edita una oración en `src/content/docs/feature-showcase.mdx` y vuelve a ejecutar `sync`: solo ese segmento se enviará al LLM.
- Añade un término a `glossary-user.csv` para garantizar la coherencia terminológica en todas las configuraciones regionales.
- Compara este sitio Starlight con la demo de Docusaurus en `examples/nextjs-app/docs-site/` (mismo contenido, `style: "docusaurus"` frente a `style: "astro-starlight"`).
