<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduzca su aplicación y documentación con el modelo de IA de su elección, sin ataduras ni reescrituras.**

CLI y kit de herramientas para internacionalizar aplicaciones JavaScript/TypeScript, aplicaciones Python y sitios de documentación. Extraiga cadenas `t()`, traduzca páginas Markdown, MDX y HTML, paquetes JSON y etiquetas SVG, todo desde una única configuración, con ajustes preestablecidos integrados para OpenAI, Anthropic, Gemini, OpenRouter, Ollama y cualquier API compatible con OpenAI. Cambie de proveedor o modelo por proyecto o por configuración regional sin modificar su código base.

Funciona con [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), Markdown sin formato y HTML sin formato. Las aplicaciones Python utilizan `t()` / `_()` o GNU gettext (Streamlit, FastAPI, Flask, Django y kits de herramientas de escritorio). Mantiene sus catálogos de [i18next](https://www.i18next.com/) existentes (JSON de espacio de nombres o cadenas de origen `t()`) y migra proyectos de [Intlayer](https://intlayer.org/) con `migrate-intlayer`.

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

<a id="which-pipeline"></a>
## ¿Qué "pipeline"?

| Su contenido | Comando |
| --- | --- |
| El origen utiliza `t()` o `_()` (JavaScript, TypeScript o Python), gettext o un archivo HTML con marcadores `data-i18n*` | **Cadenas de IU** — `extract` / `translate-ui` |
| Páginas localizadas, sitios de documentación o un archivo HTML por configuración regional | **Documentos** — `translate-docs` |
| Archivos de configuración regional JSON anidados independientes | **JSON** — `translate-json` |
| Diagramas o ilustraciones con etiquetas en SVG | **SVG** — `translate-svg` |

Consulte [¿Qué es ai-i18n-tools?](https://wsj-br.github.io/ai-i18n-tools/es/guide/what-is-ai-i18n-tools) para obtener una comparación completa.

<a id="install"></a>
## Instalar

Solo ESM. Requiere Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Establece una clave API para el proveedor que pasas a `init` (Ollama no necesita ninguna):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Configure el comando `ai-i18n-tools` básico (direnv, PATH, scripts `package.json` o `npx`) — consulte [Instalación](https://wsj-br.github.io/ai-i18n-tools/es/guide/installation).

<a id="python-no-nodejs"></a>
### Python, sin Node.js

Descargue el activo correspondiente desde el [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases): `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64` o `ai-i18n-tools-win-x64.exe`. Compruebe `SHA256SUMS.txt`, ejecute `chmod +x` en Unix y coloque el archivo en `PATH`. Los binarios no están notariados ni firmados con Authenticode. Los cuatro ejemplos de Python se encuentran en el repositorio y en `ai-i18n-tools-python-examples.zip` en la versión. No están dentro del tarball de npm ni del ejecutable. Pasos completos: [Ejecutables independientes](https://wsj-br.github.io/ai-i18n-tools/es/guide/installation#standalone-executables).

<a id="quick-start"></a>
## Inicio rápido

```bash
ai-i18n-tools init -P openrouter   # scaffold config (UI strings template)
ai-i18n-tools suggest-models         # optional ranked shortlist
ai-i18n-tools suggest-models --apply # write that list to translationModels
ai-i18n-tools sync                   # extract + translate per features
```

La lista de `init` es un punto de partida. `suggest-models` clasifica los modelos de chat del proveedor activo. `--apply` reemplaza a `translationModels`. La misma clasificación se encuentra en la pestaña [Modelos](https://wsj-br.github.io/ai-i18n-tools/es/guide/translation-dashboard/models). Referencia de comandos: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/es/reference/cli-commands/models#suggest-models).

Otros andamiajes: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, `docs-plain-html`, `ui-json-bundles`, `ui-python`, `ui-python-gettext`, `ui-python-django` o `ui-python-flask`.

Prefiera `sync` en lugar de encadenar comandos de traducción individuales. Tutorial completo: [Inicio rápido](https://wsj-br.github.io/ai-i18n-tools/es/guide/quick-start). Python: [Añadir i18n a una aplicación Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-python).

<a id="documentation"></a>
## Documentación

- [Sitio de documentación](https://wsj-br.github.io/ai-i18n-tools/es/) — guías, integraciones y referencia
- [Instalación](https://wsj-br.github.io/ai-i18n-tools/es/guide/installation) · [Inicio rápido](https://wsj-br.github.io/ai-i18n-tools/es/guide/quick-start) · [Proveedores y modelos](https://wsj-br.github.io/ai-i18n-tools/es/guide/providers-and-models)
- [Cadenas de IU](https://wsj-br.github.io/ai-i18n-tools/es/guide/ui-strings/) · [HTML sin formato](https://wsj-br.github.io/ai-i18n-tools/es/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/ui-strings/python) · [Documentos](https://wsj-br.github.io/ai-i18n-tools/es/guide/documents/) · [Páginas HTML](https://wsj-br.github.io/ai-i18n-tools/es/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/es/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/es/guide/svg-translation/)
- [Integraciones](https://wsj-br.github.io/ai-i18n-tools/es/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro y [Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/integrations/python)
- [Añadir i18n a una aplicación Python](https://wsj-br.github.io/ai-i18n-tools/es/guide/add-i18n-to-python)
- [Referencia de la CLI](https://wsj-br.github.io/ai-i18n-tools/es/reference/cli-commands/) · [Configuración](https://wsj-br.github.io/ai-i18n-tools/es/reference/configuration) · [Ayudantes de tiempo de ejecución](https://wsj-br.github.io/ai-i18n-tools/es/guide/runtime-helpers)
- [Ejemplos](https://wsj-br.github.io/ai-i18n-tools/es/examples) — demostraciones ejecutables (`npx degit …`)
- [Contexto del agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guía de integración para asistentes en repositorios de consumo

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
