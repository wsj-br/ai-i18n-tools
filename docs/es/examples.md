<a id="examples"></a>
# Ejemplos

Proyectos ejecutables en [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) en GitHub, cada uno con su propia configuración, salidas de configuración regional confirmadas y README. Puede explorar archivos traducidos sin una clave de API; la nueva ejecución de la traducción requiere una clave de proveedor ([Proveedores y modelos](/es/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Ejecutar de forma independiente (`npx degit`)

Copie un ejemplo sin clonar el repositorio completo.

<a id="nodejs-examples"></a>
### Ejemplos de Node.js

Cada ejemplo de Node.js declara un rango de versión (caret range) publicado de `ai-i18n-tools` que coincide con la versión actual del paquete e instala la CLI desde npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Ejemplos de Python

`python-streamlit`, `python-flask`, `python-fastapi` y `python-gettext` no tienen `package.json`. Los comandos `degit` en la tabla siguiente son válidos. También puede descargar `ai-i18n-tools-python-examples.zip` desde el [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases). Ese archivo zip contiene los mismos cuatro directorios. No forma parte del paquete npm y no se encuentra dentro del ejecutable independiente.

`python-streamlit`, `python-flask` y `python-fastapi` utilizan un virtualenv y `pip install -r requirements.txt`. `python-gettext` utiliza únicamente la biblioteca estándar. Traduzca con el [ejecutable independiente](/es/guide/installation#standalone-executables).

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

En Windows, active `.venv\Scripts\activate`.

Si, en cambio, clonó el repositorio **completo** de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools), ejecute `pnpm install` y `pnpm run build` en la raíz del repositorio y, a continuación, `cd examples/<name>`. Los ejemplos de espacio de trabajo (Node.js) utilizan la CLI local a través de sus scripts `pnpm run i18n:*`, o `ai-i18n-tools …` directamente después de la [configuración de PATH](/es/guide/installation#using-the-cli). Los ejemplos de Python en esa copia realizan la traducción con `node ../../bin/ai-i18n-tools.mjs` después de la compilación. Consulte [Instalación — Monorepositorio clonado](/es/guide/installation#cloned-monorepo).

<a id="which-example-matches-my-project"></a>
## ¿Qué ejemplo coincide con mi proyecto?

- Una aplicación JS/TS: [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) (la más pequeña) o [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md). Guía: [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js).
- Una aplicación Python: python-streamlit, python-flask, python-fastapi, o python-gettext. Guía: [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python).
- Un sitio web o sitio de documentación: docusaurus-docs, vitepress-docs, astro-docs, nextra-docs, fumadocs-docs, astro-website, plain-html, o plain-html-docs. Guía: [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website).
- Un README de repositorio junto a una aplicación: [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) o [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) (el ejemplo de nextjs también tiene un sitio de documentación). Guía: [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme).
- Algo más: multi-provider, test-markdown, y intlayer-migration.

<a id="list-of-examples"></a>
## Lista de ejemplos

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="intlayer-translate"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>

| Ejemplo | Ideal para | Copiar con degit | Ejecutar |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | La aplicación más pequeña que funciona con cadenas de interfaz de usuario `t()` + traducción de README | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurales + panel de control; documentación anidada de Docusaurus + README plano + recursos SVG | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (aplicación `:3030`; `cd docs-site && pnpm start` para documentación `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Solo sitio de documentación de Docusaurus (preset `docusaurus`) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; compilación + servicio, el menú de configuración regional funciona) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Página de destino de Astro: HTML de página completa + híbrido `t()` | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Sitio de documentación de Astro Starlight | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | Sitio de documentos de VitePress + JSON de tema (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / shell de diccionario `.ts`, más un componente de servidor `t()` (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / catálogo de IU (`pt`, `zh`, analizador de puntos) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | HTML simple + marcadores `data-i18n*`; JSON de configuración regional estática (interfaz de usuario estilo panel de control) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | HTML plano como documentos: una página por configuración regional, imágenes localizadas, hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Elija o compare un proveedor de LLM (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Prueba de regresión de traducción de markdown / CJK (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, restablecer + informe de agente de IA) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**intlayer-translate**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate/README.md) | Mantener Intlayer, rellenar los locales que faltan en su lugar (`translate-intlayer`; `en` + `pt-BR` enviados, `es` + `zh-Hans` faltantes) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate` | `pnpm reset && pnpm translate` (`pnpm dev` `:3093`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Panel de control de Streamlit, `t()` / `_()`, JSON de cadena de origen | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja, `t()` / `_()`, JSON de cadena de origen | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI, local de ContextVar, `t()` / `_()`, JSON de cadena de origen | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | CLI de GNU gettext existente; `extract` / `translate-ui` actualiza `.po` y `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

Cada nombre de **Ejemplo** enlaza a su README de GitHub con la configuración completa, los comandos y el diseño del proyecto, o explore el [índice de ejemplos en el repositorio](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).

Los ejemplos de Node.js instalan la CLI desde npm después de `pnpm install`. Los cuatro ejemplos de Python utilizan `venv` y `pip` (`python-gettext` utiliza únicamente la biblioteca estándar) y el [ejecutable independiente](/es/guide/installation#standalone-executables) para la traducción.

<br/>

::: tip Aviso legal
Los nombres e iconos de los productos pertenecen a sus respectivos propietarios y se utilizan únicamente con fines de identificación. Este software no está afiliado a ni respaldado por dichas marcas.
:::
