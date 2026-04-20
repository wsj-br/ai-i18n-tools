---
sidebar_position: 2
title: Introducción rápida
description: >-
  Obtén tu primer documento traducido en menos de cinco minutos usando
  ai-i18n-tools con este proyecto de ejemplo de Next.js.
translation_last_updated: '2026-04-20T20:45:14.651Z'
source_file_mtime: '2026-04-20T20:03:51.319Z'
source_file_hash: 3781b3b6f01b12a0aa8b7f15cc792f0282715729066828ccf371d959d933a447
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
npm install
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
  "targetLocales": ["es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
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
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
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
npm run start -- --locale de
```

Esto inicia el servidor de desarrollo de Docusaurus en alemán. Abre [http://localhost:3000/de/](http://localhost:3000/de/) en tu navegador para navegar por la documentación traducida.

---

## Paso 7 — Explorar la demo de Next.js (idioma + plurales cardinales) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

La traducción de documentación en este tutorial utiliza **solo Markdown**. El mismo repositorio de ejemplo también incluye una interfaz de **Next.js** en el puerto **3030**, donde puedes ver llamadas **`t()`**, URLs **`?locale=`** y una demostración de **plurales cardinales**.

Desde `examples/nextjs-app/`:

```bash
npm run dev
```

Luego abre [http://localhost:3030](http://localhost:3030).

- Cambia de idioma con el menú desplegable **Locale**, o añade **`?locale=<code>`** (por ejemplo `http://localhost:3030/?locale=ar`). La interfaz mantiene sincronizados la cadena de consulta y el menú desplegable.
- Desplázate hasta **Plurales: ejemplo de uso de generación automática**. La página repite “This page has … sections” con cantidades fijas de ejemplo (**1**, **2**, **5**, **50**) para que puedas comparar las reglas plurales entre distintos idiomas (incluyendo aquellos con múltiples formas plurales).
- Las llamadas usan **`t("…", { plurals: true, count })`**. Con **`extract`** / **`translate-ui`**, esa clave se convierte en un grupo plural en `locales/strings.json`; los archivos planos **`public/locales/*.json`** contienen las formas con sufijos. La lógica en tiempo de ejecución está en **`src/lib/i18n.ts`** — consulta la sección **Cardinal plurals example** en el [ejemplo README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) para una explicación concisa.

---

## Qué explorar a continuación {#what-to-explore-next}

- Lee el [Translation Feature Showcase](./feature-showcase) para ver cada elemento de Markdown que puede manejar `ai-i18n-tools`, incluyendo cómo se relacionan las **cadenas de interfaz de plurales cardinales** con esta canalización de documentación.
- Edita una oración en `docs-site/docs/feature-showcase.md` y vuelve a ejecutar `sync`: solo ese segmento se enviará al LLM; el resto se servirá desde la caché.
- Añade un término a `glossary-user.csv` para garantizar una terminología consistente en todos los idiomas.
- Habilita la canalización de cadenas de interfaz estableciendo `"translateUIStrings": true` y ejecutando `sync` sin la bandera `--no-ui`.
