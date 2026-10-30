<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**Traduce tu app, sitio web y documentación con los modelos que elijas en cualquier proveedor de LLM. Una sola configuración, re-ejecuciones en caché.**

CLI y conjunto de herramientas que añade idiomas a aplicaciones JavaScript/TypeScript, aplicaciones Python y sitios de documentación. El idioma desde el que empiezas es `sourceLocale`, y puede ser cualquier idioma. Encuentra el texto, lo traduce y escribe los archivos que carga tu proyecto. Los preajustes integrados cubren OpenAI, Anthropic, Gemini, OpenRouter, Ollama y cualquier API compatible con OpenAI. Cambia de proveedor o modelo por proyecto o por configuración regional.

Funciona con [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), [Markdown simple](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-readme) (un README de repositorio y otros archivos `.md`), y HTML simple. Las aplicaciones Python usan `t()` / `_()` o GNU gettext (Streamlit, FastAPI, Flask, Django y kits de herramientas de escritorio). Mantiene tus catálogos [i18next](https://www.i18next.com/) existentes (JSON de espacio de nombres o cadenas de origen `t()`). Funciona con [Intlayer](https://intlayer.org/) de dos maneras: mantén Intlayer y rellena sus diccionarios con `translate-intlayer`, o muévete a llamadas de cadena de origen `t()` con `migrate-intlayer`. Intlayer sigue siendo una buena opción para diccionarios de contenido tipado y sistemas de gestión de traducciones.

<a id="features"></a>
## Características

| | |
| --- | --- |
| **Cadenas de IU** | Extraiga `t("…")` / `_()` de JS/TS/Astro y Python, o `data-i18n*` en un archivo HTML → JSON plano por configuración regional o GNU gettext |
| **Documentos** | Traduce páginas Markdown, MDX, `.astro` y HTML (un archivo por configuración regional) |
| **JSON** | Traduzca paquetes de configuración regional anidados cuando la copia se encuentre fuera de las llamadas a `t()` |
| **SVG** | Traduzca etiquetas SVG ilustradas a través de `translate-svg` |
| **Caché inteligente** | Caché SQLite compartida: solo los segmentos nuevos o modificados llegan al modelo |
| **Un `sync`** | Ejecuta extracto → UI → SVG → docs → JSON en el orden correcto desde una configuración |
| **Python** | Ejecutable independiente en cada GitHub Release: la CLI se ejecuta sin necesidad de instalar Node.js |
| **Modelos clasificados** | `suggest-models` clasifica los modelos de chat del proveedor activo y puede escribir `translationModels` |

<a id="where-do-i-start"></a>
## ¿Por dónde empiezo?

| Tienes | Empieza aquí |
| --- | --- |
| Una aplicación JS/TS (React, Next.js, Node, CLI) con texto simple en el código fuente | [Añadir i18n a una aplicación JS/TS](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-js) |
| Una aplicación Python (Streamlit, FastAPI, Flask, de escritorio, scripts) | [Añadir i18n a una aplicación Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-python) |
| Una aplicación Django, catálogos Flask-Babel o una aplicación que ya usa GNU gettext | [Añadir i18n a una aplicación Django / Python gettext](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-django-gettext) |
| Un sitio web o sitio de documentación (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, HTML simple) | [Añadir i18n a un sitio web o sitio de documentación](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-website) |
| Un README de repositorio y otros archivos Markdown (con o sin una aplicación) | [Añadir i18n a tu README y documentos Markdown](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-readme) |
| Código que ya llama a `t()` o `_()` | [Cadenas de interfaz de usuario](https://wsj-br.github.io/ai-i18n-tools/es/guide/ui-strings/) |
| Archivos de configuración regional JSON anidados independientes | [JSON](https://wsj-br.github.io/ai-i18n-tools/es/guide/json) |
| Diagramas SVG con etiquetas de texto | [Traducción de SVG](https://wsj-br.github.io/ai-i18n-tools/es/guide/svg-translation/) |
| Diccionarios de Intlayer (mantener Intlayer, o pasar a llamadas de cadena de origen) | [Traducir Intlayer in situ](https://wsj-br.github.io/ai-i18n-tools/es/guide/translating-intlayer) · [Migrar de Intlayer a llamadas de cadena de origen](https://wsj-br.github.io/ai-i18n-tools/es/guide/migrating-from-intlayer) |

Consulta [¿Qué es ai-i18n-tools?](https://wsj-br.github.io/ai-i18n-tools/es/guide/what-is-ai-i18n-tools) para saber cómo encajan los pipelines.

<a id="install"></a>
## Instalar

Solo ESM. Requiere Node.js `>=22.16.0`.

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

Establece una clave API para el proveedor que pasas a `init` (Ollama no necesita ninguna):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Configure el comando `ai-i18n-tools` básico (direnv, PATH, scripts `package.json` o `npx`) — consulte [Instalación](https://wsj-br.github.io/ai-i18n-tools/es/guide/installation).

<a id="python-no-nodejs"></a>
### Python, sin Node.js

Linux y macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

El instalador selecciona el ejecutable para esta máquina, comprueba `SHA256SUMS.txt`, instala el comando como `ai-i18n-tools` y lo añade a `PATH`. Los binarios no están notariados ni firmados con Authenticode. Pasos de descarga manual: [Ejecutables independientes](https://wsj-br.github.io/ai-i18n-tools/es/guide/installation#standalone-executables).

Los cuatro ejemplos de Python están en el repositorio y en `ai-i18n-tools-python-examples.zip` en la versión. No están dentro del tarball de npm ni del ejecutable.

<a id="quick-start"></a>
## Inicio rápido

Genera la configuración para lo que tienes, luego sigue la guía para tu ruta:

| Tienes | Generar | Luego sigue |
| --- | --- | --- |
| Una aplicación JS/TS | `ai-i18n-tools init -P openrouter` | [Añadir i18n a una aplicación JS/TS](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-js) |
| Una aplicación Python | `ai-i18n-tools init -t ui-python -P openrouter` | [Añadir i18n a una aplicación Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-python) |
| Una aplicación Django o GNU gettext | `ai-i18n-tools init -t ui-python-django -P openrouter` (o `ui-python-gettext`, `ui-python-flask`) | [Añadir i18n a una aplicación Django / Python gettext](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-django-gettext) |
| Un sitio web o de documentación | `ai-i18n-tools init -t ui-vitepress -P openrouter` (intercambia la plantilla por la de tu framework) | [Añadir i18n a un sitio web o de documentación](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-website) |
| Un README, con o sin una aplicación | `ai-i18n-tools init -P openrouter` (aplicación JS/TS + README) o `init -t docs-markdown` | [Añadir i18n a tu README y documentos Markdown](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-readme) |

Cuando el proyecto esté listo, ejecuta `ai-i18n-tools sync`, luego `ai-i18n-tools status` para ver lo que se tradujo.

Una aplicación JS/TS debe primero envolver su texto en `t()`. Si se ejecuta en texto plano, `sync` finaliza sin errores y no escribe nada útil. El framework de tu sitio también debe tener su propio enrutamiento i18n habilitado antes de `sync`.

Plantillas para sitios web: `ui-starlight`, `ui-docusaurus`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, y `ui-plain-html` o `docs-plain-html`. Solo README y Markdown: `docs-markdown`. Añada `--with-readme` a cualquier otra plantilla para incluir el bloque README. Aplicaciones Python gettext: `ui-python-django`, `ui-python-flask`, `ui-python-gettext`. JSON i18next anidado: `ui-json-bundles`. Lista completa: [Referencia de configuración de CLI](https://wsj-br.github.io/ai-i18n-tools/es/reference/cli-commands/setup).

`suggest-models` clasifica los modelos de chat del proveedor activo según benchmarks publicados, y `suggest-models --apply` reemplaza a `translationModels`. La misma clasificación está en la pestaña [Modelos](https://wsj-br.github.io/ai-i18n-tools/es/guide/translation-dashboard/models). Guía: [Modelos de IA](https://wsj-br.github.io/ai-i18n-tools/es/guide/ai-models). Referencia de comandos: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/es/reference/cli-commands/models#suggest-models).

Prefiere `sync` a encadenar comandos de traducción individuales. Guía completa: [Inicio rápido](https://wsj-br.github.io/ai-i18n-tools/es/guide/quick-start). Más de un tipo de contenido en un proyecto: [Combinar pipelines](https://wsj-br.github.io/ai-i18n-tools/es/guide/combining-pipelines).

<a id="documentation"></a>
## Documentación

- [Sitio de documentación](https://wsj-br.github.io/ai-i18n-tools/es/) — guías, integraciones y referencia
- [Instalación](https://wsj-br.github.io/ai-i18n-tools/es/guide/installation) · [Inicio rápido](https://wsj-br.github.io/ai-i18n-tools/es/guide/quick-start) · [Proveedores de LLM](https://wsj-br.github.io/ai-i18n-tools/es/guide/providers-and-models) · [Modelos de IA](https://wsj-br.github.io/ai-i18n-tools/es/guide/ai-models)
- [Cadenas de IU](https://wsj-br.github.io/ai-i18n-tools/es/guide/ui-strings/) · [HTML sin formato](https://wsj-br.github.io/ai-i18n-tools/es/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/ui-strings/python) · [Documentos](https://wsj-br.github.io/ai-i18n-tools/es/guide/documents/) · [Páginas HTML](https://wsj-br.github.io/ai-i18n-tools/es/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/es/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/es/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [traducir diccionarios in situ](https://wsj-br.github.io/ai-i18n-tools/es/guide/translating-intlayer) · [mover a llamadas de cadena de origen](https://wsj-br.github.io/ai-i18n-tools/es/guide/migrating-from-intlayer)
- [Integraciones](https://wsj-br.github.io/ai-i18n-tools/es/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, y [Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/integrations/python)
- [Añadir i18n a su proyecto](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-your-project) — [Aplicación JS/TS](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-js) · [Aplicación Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-python) · [Aplicación Django / gettext](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-django-gettext) · [sitio web o sitio de documentación](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-website) · [Documentación README y Markdown](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-readme) · [Combinación de pipelines](https://wsj-br.github.io/ai-i18n-tools/es/guide/combining-pipelines)
- [Referencia de CLI](https://wsj-br.github.io/ai-i18n-tools/es/reference/cli-commands/) · [Configuración](https://wsj-br.github.io/ai-i18n-tools/es/reference/configuration) · [Ayudantes de tiempo de ejecución](https://wsj-br.github.io/ai-i18n-tools/es/guide/runtime-helpers)
- [Ejemplos](https://wsj-br.github.io/ai-i18n-tools/es/examples) — demos ejecutables (`npx degit …`)
- [Contexto de agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — prompt conciso / punto de entrada `AGENTS.md` para proyectos de consumo
- [Habilidades de agente portátiles](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills) — una sola instalación, luego un comando de barra por flujo de trabajo: `npx skills add wsj-br/ai-i18n-tools --all -y` (Node.js 22.20+); [guía de instalación](https://wsj-br.github.io/ai-i18n-tools/es/guide/coding-agent-skill)

<a id="contributing"></a>
## Contribución

Los problemas y las solicitudes de extracción son bienvenidos. Flujos de trabajo de mantenedor para este repositorio: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) y [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## Licencia

MIT — consulte [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

Los nombres de los productos y los iconos pertenecen a sus respectivos propietarios y se utilizan únicamente con fines de identificación. Este software no está afiliado a ni respaldado por dichas marcas.

<small>

> **Nota sobre las traducciones de la interfaz de usuario y la documentación:** Todos los idiomas de la interfaz y de la documentación, excepto el inglés (Reino Unido), se tradujeron con IA mediante este paquete (ai-i18n-tools); la redacción puede ser imprecisa o contener errores.

</small>
