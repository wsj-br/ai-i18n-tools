<a id="examples"></a>
# Ejemplos

Proyectos ejecutables en [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) en GitHub, cada uno con su propia configuración, salidas de configuración regional confirmadas y README. Puede explorar archivos traducidos sin una clave de API; la nueva ejecución de la traducción requiere una clave de proveedor ([Proveedores y modelos](/es/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Ejecutar de forma independiente (`npx degit`)

Copie un ejemplo sin clonar el repositorio completo. Cada uno declara `"ai-i18n-tools": "^1.7.2"` e instala la CLI desde npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

Si clonó el repositorio **completo** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools), ejecute `pnpm install` y `pnpm run build` en la raíz del repositorio, luego `cd examples/<name>`. Los ejemplos del espacio de trabajo usan la CLI local a través de sus scripts `pnpm run i18n:*`, o `ai-i18n-tools …` sin formato después de la [configuración de PATH](/es/guide/installation#using-the-cli). Consulte [Instalación — Monorepo clonado](/es/guide/installation#cloned-monorepo).

<a id="list-of-examples"></a>
## Lista de ejemplos

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| Ejemplo | Ideal para | Copiar con degit | Ejecutar |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | La aplicación más pequeña que funciona con cadenas de interfaz de usuario `t()` + traducción de README | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurales + panel de control; documentación anidada de Docusaurus + README plano + recursos SVG | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (aplicación `:3030`; `cd docs-site && pnpm start` para documentación `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Solo sitio de documentación de Docusaurus (preset `docusaurus`) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; compilación + servicio, el menú de configuración regional funciona) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Página de destino de Astro: HTML de página completa + híbrido `t()` | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Sitio de documentación de Astro Starlight | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | Sitio de documentos de VitePress + JSON de tema (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / shell de diccionario `.ts` (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / catálogo de IU (`pt`, `zh`, analizador de puntos) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | HTML simple + marcadores `data-i18n*`; JSON de configuración regional estática (interfaz de usuario estilo panel de control) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Elija o compare un proveedor de LLM (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Prueba de regresión de traducción de markdown / CJK (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

Cada nombre de **Ejemplo** enlaza a su README de GitHub con la configuración completa, los comandos y el diseño del proyecto, o explore el [índice de ejemplos en el repositorio](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).
