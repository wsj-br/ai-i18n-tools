---
sidebar_position: 2
title: Introducción rápida
description: >-
  Obtén tu primer documento traducido en menos de cinco minutos usando
  ai-i18n-tools con este proyecto de ejemplo de Next.js.
translation_last_updated: '2026-04-18T22:42:43.625Z'
source_file_mtime: '2026-04-18T18:55:03.274Z'
source_file_hash: 3959ea2c2c86befb8702ecbb126b291ff7bf1392e0bc282080c16ea52e8e1a3b
translation_language: es
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# Introducción rápida

Sigue los pasos a continuación para ejecutar tu primera traducción con `ai-i18n-tools`. Esta guía utiliza el proyecto de ejemplo de Next.js que ya estás leyendo — todos los comandos deben ejecutarse desde el directorio `examples/nextjs-app/`.

---

## Requisitos previos

Antes de comenzar, asegúrate de tener lo siguiente:

- **Node.js 18+** — verifica con `node --version`
- **Una clave API de OpenRouter** — regístrate en [openrouter.ai](https://openrouter.ai) y copia tu clave desde el panel
- **npm o pnpm** — cualquiera de los gestores de paquetes funciona

---

## Paso 1 — Instalar dependencias

```bash
cd examples/nextjs-app
npm install
```

Esto instala `ai-i18n-tools` junto con los paquetes de Next.js y Docusaurus utilizados por este ejemplo.

---

## Paso 2 — Establece tu clave API

Crea un archivo `.env` en el directorio `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lee esta variable automáticamente. Nunca confirmes el archivo `.env` en el control de versiones.

---

## Paso 3 — Revisa la configuración

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

El array `contentPaths` indica al herramienta qué directorios (o archivos individuales) traducir. `outputDir` es el directorio donde se escriben los archivos traducidos.

---

## Paso 4 — Ejecuta la sincronización

Traduce solo la documentación (por ahora omite cadenas de interfaz y SVGs):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Verás una salida similar a esta:

```
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

En la segunda ejecución, la mayoría de los segmentos serán **aciertos de caché** y la traducción se completará en menos de un segundo.

---

## Paso 5 — Inspecciona la salida

Los archivos traducidos se escriben en `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. Ábrelos para compararlos con el original:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Aspectos clave a verificar:

- Los bloques de código son **idénticos** al origen; ningún código fue traducido.
- Los valores del front matter (`title`, `description`) están traducidos.
- Los `code spans` en línea dentro del texto se conservan textualmente.
- Los enlaces mantienen su `href` original; solo cambia el texto del enlace.

---

## Paso 6 — Iniciar Docusaurus

```bash
cd docs-site
npm run start -- --locale de
```

Esto inicia el servidor de desarrollo de Docusaurus en alemán. Abre [http://localhost:3000/de/](http://localhost:3000/de/) en tu navegador para navegar por la documentación traducida.

---

## Paso 7 — Explorar la demo de Next.js (plural local + cardinal)

La traducción de documentación en este tutorial utiliza **solo Markdown**. El mismo repositorio de ejemplo también incluye una interfaz de usuario de **Next.js** en el puerto **3030**, donde puedes ver llamadas **`t()`**, URLs **`?locale=`** y una demostración de **plural cardinal**.

Desde `examples/nextjs-app/`:

```bash
npm run dev
```

Luego abre [http://localhost:3030](http://localhost:3030).

- Cambia los idiomas con el menú desplegable de **Locale**, o añade **`?locale=<code>`** (por ejemplo `http://localhost:3030/?locale=ar`). La interfaz mantiene sincronizados la cadena de consulta y el menú desplegable.
- Desplázate hasta **Plurales: ejemplo de uso de generación automática**. La página repite “This page has … sections” para cantidades fijas de ejemplo (**1**, **2**, **5**, **50**) para que puedas comparar reglas plurales entre distintos idiomas (incluyendo aquellos con múltiples formas plurales).
- Las llamadas usan **`t("…", { plurals: true, count })`**. Con **`extract`** / **`translate-ui`**, esa clave se convierte en un grupo plural en `locales/strings.json`; los archivos planos **`public/locales/*.json`** contienen las formas con sufijos. La conexión en tiempo de ejecución está en **`src/lib/i18n.ts`** — consulta la sección **Cardinal plurals example** en el [README del ejemplo](../../README.md) para una explicación concisa.

---

## Qué explorar a continuación

- Lee el [Translation Feature Showcase](./feature-showcase) para ver cada elemento de Markdown que `ai-i18n-tools` puede manejar — incluyendo cómo las **cadenas de interfaz de plural cardinal** se relacionan con esta canalización de documentación.
- Edita una oración en `docs-site/docs/feature-showcase.md` y vuelve a ejecutar `sync` — solo ese segmento será enviado al LLM; el resto se sirven desde la caché.
- Añade un término a `glossary-user.csv` para garantizar una terminología coherente en todos los idiomas.
- Activa la canalización de cadenas de interfaz estableciendo `"translateUIStrings": true` y ejecutando `sync` sin la bandera `--no-ui`.
