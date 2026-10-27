---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  Haz que tu aplicación, sitio web o documentación de repositorio de un solo
  idioma sea multilingüe con configuración guiada, traducción por IA y
  ejecuciones en caché. Empieza con JavaScript, TypeScript, Python o un README.
hero:
  name: ai-i18n-tools
  text: Haz que tu proyecto de un solo idioma sea multilingüe.
  tagline: >-
    Añade idiomas a la documentación de tu aplicación, sitio web o repositorio
    con una configuración guiada y traducción con IA. Elige tu proveedor y tus
    modelos, y reutiliza las traducciones almacenadas en caché a medida que tu
    proyecto crece.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: Logotipo de ai-i18n-tools
  actions:
    - theme: brand
      text: Elige tu proyecto
      link: '#start-here'
    - theme: alt
      text: Explorar ejemplos
      link: /es/examples
---



<a id="start-here"></a>
## Empieza con el proyecto que ya tienes

¿Un solo idioma hoy? Empieza aquí. Ese idioma puede ser cualquiera: configúralo como `sourceLocale`. El inglés es un ejemplo común en estas guías. La internacionalización (i18n) prepara tu proyecto para admitir diferentes idiomas; estas guías te llevan desde la configuración hasta tu primera experiencia traducida, incluyendo el README que tu repositorio ya muestra en GitHub, GitLab o cualquier otro host.

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Aplicación JavaScript o TypeScript

Convierte botones, etiquetas y mensajes de texto sin formato en una interfaz de usuario multilingüe. Configura tu entorno de ejecución, marca el texto a traducir y conecta el cambio de idioma. Incluye indicaciones del agente de codificación para el paso de preparación.

React · Next.js · Node.js · CLI

[Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Aplicación Python

Envuelve el texto orientado al usuario y carga los mensajes traducidos con un asistente generado, o mantén gettext nativo. Ejecuta la CLI de traducción desde un ejecutable independiente sin una instalación de Node.js separada.

Streamlit · FastAPI · Flask · Django · CLI

[Añadir i18n a una aplicación de Python](/es/guide/add-i18n-to-python)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Sitio web o documentación

Publique páginas localizadas y conéctelas a las rutas de idioma de su sitio. Siga los pasos específicos del framework para la navegación, las etiquetas de tema y el menú de idioma.

VitePress · Starlight · Docusaurus · Astro

[Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### README y documentos del repositorio

Traduzca `README.md` y otros archivos Markdown en un archivo por idioma, con una fila de enlaces entre ellos. Combínelo con las cadenas de interfaz de usuario de su aplicación, o traduzca el README por sí solo.

GitHub · GitLab · Bitbucket

[Añadir i18n a tus documentos README y de Markdown](/es/guide/add-i18n-to-readme)

</article>
</div>

¿No está seguro de qué ruta se ajusta? [Añadir i18n a su proyecto](/es/guide/add-i18n-to-your-project) enumera todos los tutoriales. [Vea lo que hacen las herramientas ai-i18n](/es/guide/what-is-ai-i18n-tools) para saber cómo encajan las canalizaciones.

## Desde la configuración hasta su primer idioma nuevo

<div class="home-steps">

1. **Prepara tu proyecto.** Elige los idiomas, un proveedor de traducción y los modelos que quieres probar. Para las aplicaciones, marca el texto que ve el usuario y configura el tiempo de ejecución de la traducción. Para los sitios, habilita el enrutamiento de idiomas de tu framework. Las guías incluyen prompts para agentes de codificación donde se necesiten cambios en el código fuente.
2. **Traduce a archivos que puedas usar.** Cuando la configuración esté lista, ejecuta `sync`. Extrae las cadenas de texto compatibles de la aplicación, traduce el contenido que has habilitado y escribe archivos de configuración regional o páginas localizadas.
3. **Carga, comprueba y continúa.** Conecta la salida a tu aplicación o sitio, implementa el cambio de idioma y comprueba un idioma de destino. Vuelve a ejecutarlo después de hacer cambios en el código fuente para traducir el texto nuevo o modificado.

</div>

Usted se encarga de la configuración del tiempo de ejecución y el enrutamiento, manualmente o con un agente de codificación. La CLI se encarga de la extracción, traducción, validación y generación de archivos, no de la reescritura automática del código fuente ni de la instalación del conmutador de idioma. [Siga el inicio rápido completo](/es/guide/quick-start).

## Su texto fuente. Listo para más idiomas.

Este ejemplo ilustrativo de JS/TS muestra la forma del resultado después de la configuración en tiempo de ejecución y la traducción. Marcar la cadena de origen la hace detectable; cada archivo de configuración regional generado asigna esa frase a su traducción.

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

La frase de origen permanece legible en su código. Su aplicación carga los archivos de configuración regional generados en tiempo de ejecución. ¿Quiere ver el cableado completo? [Explore el ejemplo de Next.js en funcionamiento](/es/examples#nextjs-app). Los sitios web siguen una ruta diferente: [generan páginas localizadas](/es/guide/add-i18n-to-website) en lugar de envolver cada párrafo.

## Construido también para la próxima actualización

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Elige tu proveedor y tus modelos

Utilice proveedores compatibles como OpenAI, Anthropic, OpenRouter, Gemini, Ollama local u otras nueve opciones integradas. También puede utilizar cualquier proveedor compatible con OpenAI. La calidad de la traducción sigue la lista de modelos (`translationModels`, más las anulaciones por configuración regional). `suggest-models` y la misma clasificación en el panel de **Modelos** crean esa lista a partir de benchmarks de traducción publicados.

[Proveedores de LLM](/es/guide/providers-and-models) · [Modelos de IA](/es/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Reutilice el trabajo ya realizado

Las traducciones en caché permiten que los reprocesamientos se centren en el texto nuevo o modificado en lugar de traducir todo de nuevo.

[Mantenlo traducido](/es/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Revise la salida de la IA localmente

Inspeccione las traducciones, corrija la redacción y gestione la terminología en el Panel de control de traducción.

[Ver el dashboard](/es/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Mantenga la aplicación y el contenido juntos

Traduzca los mensajes de la aplicación, la documentación, el JSON de configuración regional anidado y las etiquetas de texto SVG desde una única configuración. Habilite solo lo que necesite.

[Combinación de pipelines](/es/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Traduzca el README con la aplicación

Un `sync` cubre las cadenas de la interfaz de usuario y el Markdown del repositorio, y escribe una fila de idioma en el README.

[Añadir i18n a tus documentos README y de Markdown](/es/guide/add-i18n-to-readme)

</article>
</div>

## Vea un proyecto en funcionamiento primero

Estos ejemplos incluyen la configuración y los archivos traducidos confirmados. Explore la salida sin una clave de API; volver a ejecutar la traducción requiere un proveedor configurado y, por lo general, una clave. Ollama local no necesita clave de API.

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Una aplicación multilingüe

Vea los componentes de React, el cableado en tiempo de ejecución, los plurales y el cambio de idioma en un proyecto Next.js en funcionamiento.

[Explorar el ejemplo de Next.js](/es/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Python en la práctica

Vea cómo una aplicación Streamlit envuelve sus mensajes y utiliza JSON traducido sin añadir un entorno de ejecución de JavaScript a la aplicación.

[Explorar el ejemplo de Streamlit](/es/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Documentación en más idiomas

Vea las páginas de VitePress traducidas junto con la navegación localizada y las etiquetas del tema.

[Explorar el ejemplo de VitePress](/es/examples#vitepress-docs)

</article>
</div>

[Explore todos los ejemplos ejecutables](/es/examples), incluyendo HTML sin formato, otros frameworks y flujos de trabajo de i18n existentes.

## ¿Ya tiene i18n? Conserve lo que funciona.

No tiene que empezar de nuevo.

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Llamadas a cadenas de origen

Mantén las llamadas a `t()` y gettext ya existentes en el proyecto.

[Cadenas de IU de JS/TS](/es/guide/ui-strings/) · [Python y gettext](/es/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Paquetes JSON

Traduce archivos de localización anidados, incluyendo espacios de nombres de i18next. La navegación del sitio y los catálogos de temas pertenecen a la [traducción de documentos](/es/guide/add-i18n-to-website#what-gets-translated), no a esta ruta.

[Traducir paquetes JSON](/es/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Diccionarios de Intlayer

Mantén Intlayer y completa las traducciones faltantes, o migra la aplicación a llamadas de cadenas de origen.

[Traducción in situ](/es/guide/translating-intlayer) · [Migrar a llamadas de cadena de origen](/es/guide/migrating-from-intlayer)

</article>
</div>

¿También tienes diagramas? [Traduce las etiquetas de texto SVG](/es/guide/svg-translation/) junto con tu aplicación o documentos.

<a id="quick-install"></a>
## ¿Listo para añadir tu primer idioma?

<div class="home-cta">

[Elige tu proyecto](#start-here) para la guía completa, o [abre el inicio rápido](/es/guide/quick-start) para la instalación y configuración.

Instala el [paquete npm](/es/guide/installation) para un proyecto de Node.js.

<a id="python-no-nodejs"></a>

Para Python, [descarga el ejecutable independiente](/es/guide/installation#standalone-executables)—no se requiere una instalación de Node.js separada.

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="explore-the-documentation"></a>
## Profundiza cuando lo necesites

[Integraciones](/es/guide/integrations/) · [Proveedores de LLM](/es/guide/providers-and-models) · [Modelos de IA](/es/guide/ai-models) · [Configuración](/es/reference/configuration) · [Referencia de la CLI](/es/reference/cli-commands/)

<br/>

<br/>

::: info Acerca de este sitio
La interfaz y la documentación no inglesas fueron traducidas con ai-i18n-tools. Las traducciones de IA pueden contener errores.

Todos los nombres de productos, logotipos y marcas comerciales son propiedad de sus respectivos dueños. Los iconos y nombres se utilizan únicamente con fines de identificación. Este proyecto no está afiliado ni respaldado por esas marcas.
:::
