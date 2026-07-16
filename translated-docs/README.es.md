<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduzca su aplicación y documentación con el modelo de IA de su elección, sin ataduras ni reescrituras.**

CLI y kit de herramientas para internacionalizar aplicaciones JavaScript/TypeScript y sitios de documentación (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, Markdown/MDX simple). Utilice ajustes preestablecidos integrados para OpenAI, Anthropic, Gemini, OpenRouter, Ollama y más, o cualquier API compatible con OpenAI. Cambie de proveedor o modelo por proyecto o por configuración regional sin cambiar su base de código.

## Características

| | |
| --- | --- |
| **Cadenas de interfaz de usuario** | Extraiga `t("…")` de JS/TS/Astro (y `data-i18n*` en HTML) → JSON plano por configuración regional |
| **Documentos** | Traduzca páginas Markdown, MDX y `.astro` para los principales marcos de documentos |
| **JSON** | Traduzca paquetes de configuración regional anidados cuando la copia se encuentre fuera de las llamadas a `t()` |
| **SVG** | Traduzca etiquetas SVG ilustradas a través de `translate-svg` |
| **Caché inteligente** | Caché SQLite compartida: solo los segmentos nuevos o modificados llegan al modelo |
| **Un `sync`** | Ejecuta extracto → UI → SVG → docs → JSON en el orden correcto desde una configuración |

## ¿Qué pipeline?

| Su contenido | Comando |
| --- | --- |
| La fuente utiliza `t()` o marcadores HTML | **Cadenas de interfaz de usuario** — `extract` / `translate-ui` |
| Páginas localizadas o sitios de documentos | **Documentos** — `translate-docs` |
| Archivos de configuración regional JSON anidados independientes | **JSON** — `translate-json` |

Consulte [¿Qué es ai-i18n-tools?](../docs/guide/what-is-ai-i18n-tools.md) para una comparación completa.

## Instalar

Solo ESM. Requiere Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Establezca una clave API para su proveedor (el `init` predeterminado usa OpenRouter; Ollama no necesita ninguna):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Configure el comando `ai-i18n-tools` básico (direnv, PATH, scripts `package.json` o `npx`) — consulte [Instalación](../docs/guide/installation.md).

## Inicio rápido

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Andamios orientados a documentos: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` o `ui-json-bundles`.

Prefiera `sync` en lugar de encadenar comandos de traducción individuales. Tutorial completo: [Inicio rápido](../docs/guide/quick-start.md).

## Documentación

- [Sitio de documentación](https://wsj-br.github.io/ai-i18n-tools/) — guías, integraciones y referencia
- [Instalación](../docs/guide/installation.md) · [Inicio rápido](../docs/guide/quick-start.md) · [Proveedores y modelos](../docs/guide/providers-and-models.md)
- [Cadenas de interfaz de usuario](../docs/guide/ui-strings/) · [Documentos](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [Integraciones](../docs/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [Referencia de CLI](../docs/reference/cli-commands/) · [Configuración](../docs/reference/configuration.md) · [Ayudantes de tiempo de ejecución](../docs/guide/runtime-helpers.md)
- [Ejemplos](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — demostraciones ejecutables (`npx degit …`)
- [Contexto de agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guía de integración para asistentes en repositorios de consumidores

## Contribución

Los problemas y las solicitudes de extracción son bienvenidos. Flujos de trabajo de mantenedor para este repositorio: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) y [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

## Licencia

MIT — consulte [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.
