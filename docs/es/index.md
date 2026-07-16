---
layout: home
title: ai-i18n-tools
description: >-
  CLI y kit de herramientas para internacionalizar aplicaciones y sitios de
  documentación de JavaScript/TypeScript usando LLM.
hero:
  name: ai-i18n-tools
  text: Traduce aplicaciones y documentos con cualquier LLM
  tagline: >-
    Un archivo de configuración, tres modos de traducción y el proveedor que
    elijas: OpenAI, Anthropic, Gemini, OpenRouter, Ollama o cualquier API
    compatible con OpenAI. Cambia de modelo por proyecto o por idioma sin
    reescribir tu código base.
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
      Extrae llamadas t() de JS, TS y Astro. Genera JSON plano por idioma para
      i18next o búsqueda estática SSG.
  - icon: 📄
    title: Documentos
    details: >-
      Traduce páginas de Markdown, MDX y Astro para VitePress, Starlight,
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
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Instalación rápida

El paquete publicado es **solo ESM**. Se requiere Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

Consulte [Instalación](/es/guide/installation) para [configurar el comando CLI básico](/es/guide/installation#using-the-cli) (incluido el [desarrollo de monorepo clonado](/es/guide/installation#cloned-monorepo)) y [Inicio rápido](/es/guide/quick-start) para las plantillas de andamiaje.

<a id="which-pipeline-should-i-use"></a>
## ¿Qué pipeline debo usar?

| Su contenido | Comando |
| --- | --- |
| El código fuente usa `t()` | **Cadenas de interfaz de usuario** — `extract` / `translate-ui` |
| Páginas localizadas o sitios de documentos | **Documentos** — `translate-docs` |
| Archivos de configuración regional JSON anidados independientes | **JSON** — `translate-json` |

Las ilustraciones SVG usan una ruta `translate-svg` separada, no `docs[].contentPaths`. Consulte [¿Qué es ai-i18n-tools?](/es/guide/what-is-ai-i18n-tools) para una comparación completa.

<a id="explore-the-documentation"></a>
## Explorar la documentación

- [**Guía**](/es/guide/what-is-ai-i18n-tools) — modos de traducción, instalación, inicio rápido e integraciones de frameworks
- [**Integraciones**](/es/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus y Astro
- [**Proveedores y modelos**](/es/guide/providers-and-models) — preajustes, cadenas de respaldo y anulaciones de `-P`
- [**Referencia de la CLI**](/es/reference/cli-commands/) — cada comando, bandera y flujo de trabajo
- [**Configuración**](/es/reference/configuration) — esquema completo de `ai-i18n-tools.config.json`
- [**Ejemplos**](/es/examples) — nueve proyectos de demostración ejecutables con `npx degit`
- [**Arquitectura**](/es/reference/architecture) — elementos internos, API programática y puntos de extensión

¿Va a integrar el paquete en su propio proyecto? Empiece con [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md). El [README del repositorio](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) es una breve página de inicio de GitHub/npm que enlaza aquí para obtener más detalles.
