---
layout: home
title: ai-i18n-tools
description: >-
  CLI y kit de herramientas para internacionalizar aplicaciones
  JavaScript/TypeScript, aplicaciones Python y sitios de documentación con el
  proveedor de LLM que elija.
hero:
  name: ai-i18n-tools
  text: Traduce aplicaciones y documentos con cualquier LLM
  tagline: >-
    Extraiga cadenas t() de JavaScript, TypeScript y Python. Traduzca páginas
    Markdown, MDX, HTML, paquetes JSON y etiquetas SVG, todo desde una única
    configuración, con OpenAI, Anthropic, Gemini, OpenRouter, Ollama o cualquier
    API compatible con OpenAI. Cambie de modelo por proyecto o por configuración
    regional sin tener que reescribir su código base.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: Logotipo de ai-i18n-tools
  actions:
    - theme: brand
      text: Empezar
      link: /es/guide/quick-start
    - theme: alt
      text: Ver en GitHub
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: Paquete npm
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: Cadenas de interfaz de usuario
    details: >-
      Extraiga t() y _() de JavaScript, TypeScript, Astro y Python, o marcadores
      data-i18n en un archivo HTML. JSON plano por configuración regional o
      catálogos GNU gettext.
  - icon: 📄
    title: Documentos
    details: >-
      Traduce páginas Markdown, MDX, Astro y HTML para VitePress, Starlight,
      Docusaurus, Nextra, Fumadocs y sitios estáticos simples.
  - icon: 📦
    title: Paquetes JSON
    details: >-
      JSON de idioma anidado cuando el texto de la interfaz de usuario reside
      fuera de las llamadas t() de origen: etiquetas de tema, catálogos y
      anulaciones de aplicaciones.
  - icon: 🔄
    title: Almacenamiento en caché inteligente
    details: >-
      Caché SQLite compartida en todas las canalizaciones. Solo los segmentos
      nuevos o modificados se envían al modelo en las repeticiones.
  - icon: 🔌
    title: Independiente del proveedor
    details: >-
      Preajustes integrados para las principales API de LLM, además de puntos
      finales personalizados compatibles con OpenAI. Anula el proveedor activo
      con -P.
  - icon: ⚡
    title: Un comando de sincronización
    details: >-
      Ejecute extract, translate-ui, translate-svg, translate-docs y
      translate-json en el orden correcto desde una única configuración.
  - icon: 🐍
    title: Python, sin Node.js
    details: >-
      Un ejecutable independiente en cada GitHub Release ejecuta la CLI para
      aplicaciones Python. Incluye Streamlit, FastAPI, Flask, Django y gettext.
  - icon: 📊
    title: Lista de modelos clasificados
    details: >-
      suggest-models clasifica los modelos de chat del proveedor activo y puede
      escribir translationModels. La misma clasificación se encuentra en la
      pestaña Models del panel de control.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Instalación rápida

El paquete publicado es **solo ESM**. Se requiere Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` clasifica los modelos del proveedor activo. Añada `--apply` para reemplazar la lista `translationModels` generada automáticamente. Consulte [Inicio rápido](/es/guide/quick-start) y la pestaña [Modelos](/es/guide/translation-dashboard/models).

<a id="python-no-nodejs"></a>
### Python, sin Node.js

Descargue el archivo correspondiente de la [versión de GitHub](https://github.com/wsj-br/ai-i18n-tools/releases): `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64` o `ai-i18n-tools-win-x64.exe`. Compruebe `SHA256SUMS.txt`, ejecute `chmod +x` en Unix y coloque el archivo en `PATH`. Los binarios no están firmados. Pasos: [Ejecutables independientes](/es/guide/installation#standalone-executables). Luego `ai-i18n-tools init -t ui-python -P cheaperinference`. Tutorial: [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python).

Consulte [Instalación](/es/guide/installation) para [configurar el comando CLI básico](/es/guide/installation#using-the-cli) (incluido el [desarrollo de monorepo clonado](/es/guide/installation#cloned-monorepo)) y [Inicio rápido](/es/guide/quick-start) para las plantillas de andamiaje.

<a id="which-pipeline-should-i-use"></a>
## ¿Qué pipeline debo usar?

| Su contenido | Comando |
| --- | --- |
| El código fuente utiliza `t()` o `_()` (JavaScript, TypeScript o Python), gettext o un archivo HTML con marcadores | **Cadenas de la interfaz de usuario** — `extract` / `translate-ui` |
| Páginas localizadas, sitios de documentación o un archivo HTML por configuración regional | **Documentos** — `translate-docs` |
| Archivos de configuración regional JSON anidados independientes | **JSON** — `translate-json` |

Las ilustraciones SVG usan una ruta `translate-svg` separada, no `docs[].contentPaths`. Consulte [¿Qué es ai-i18n-tools?](/es/guide/what-is-ai-i18n-tools) para una comparación completa.

<a id="explore-the-documentation"></a>
## Explorar la documentación

- [**Guía**](/es/guide/what-is-ai-i18n-tools) — modos de traducción, instalación, inicio rápido e integraciones de framework
- [**Integraciones**](/es/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro y Python
- [**Proveedores y modelos**](/es/guide/providers-and-models) — ajustes preestablecidos, cadenas de reserva, sugerencias clasificadas (`suggest-models`) y anulaciones de `-P`
- [**Referencia de la CLI**](/es/reference/cli-commands/) — cada comando, flag y flujo de trabajo
- [**Configuración**](/es/reference/configuration) — esquema completo de `ai-i18n-tools.config.json`
- [**Ejemplos**](/es/examples) — diecisiete proyectos de demostración ejecutables (`npx degit` o el archivo zip con ejemplos de Python)
- [**Arquitectura**](/es/reference/architecture) — aspectos internos, API programática y puntos de extensión

¿Va a integrar el paquete en su propio proyecto? Empiece con [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md). El [README del repositorio](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) es una breve página de inicio de GitHub/npm que enlaza aquí para obtener más detalles.

<br/>
<br/>

::: tip Descargo de responsabilidad
Los nombres e iconos de los productos pertenecen a sus respectivos propietarios y se utilizan únicamente con fines de identificación. Este software no está afiliado a ni respaldado por dichas marcas.

Todos los idiomas de la interfaz y de la documentación, excepto el inglés (Reino Unido), se han traducido mediante IA utilizando este paquete (ai-i18n-tools); la redacción puede ser imprecisa o contener errores.
:::

<br/>
