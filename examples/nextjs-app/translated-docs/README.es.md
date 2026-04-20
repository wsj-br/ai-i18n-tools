# Ejemplo de aplicación Next.js

Este ejemplo muestra cómo usar `ai-i18n-tools` con una aplicación [Next.js](https://nextjs.org/) en **TypeScript** y **pnpm**. La interfaz coincide con el [ejemplo de aplicación de consola](../../console-app/), utilizando las mismas claves de cadena y un selector de configuración regional controlado por `locales/ui-languages.json` (primero la configuración regional de origen `en-GB`, seguida de los objetivos de traducción). `[src/lib/i18n.ts](../src/lib/i18n.ts)` genera `**localeLoaders`** a partir de ese manifiesto (todos los `code` excepto `SOURCE_LOCALE`), como la aplicación de consola; los paquetes se cargan con `**fetch**` a `**public/locales/<locale>.json**`.

Anidado bajo esta carpeta hay un pequeño sitio **[Docusaurus](https://docusaurus.io/)** (`[docs-site/](../docs-site/)`) con un subconjunto seleccionado de la documentación del proyecto principal para navegación local.

**Leer en otros idiomas:**
[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

## Captura de pantalla

captura de pantalla

## Requisitos

- Node.js >= 22.16 (coincide con el campo `engines` del repositorio)
- [pnpm](https://pnpm.io/) >= 10.33 (ver el `package.json` `packageManager` / `engines` raíz)
- Una clave de API de [OpenRouter](https://openrouter.ai) (para generar traducciones)

## Instalación

Desde la **raíz del repositorio**, ejecute:

```bash
pnpm install
```

El `pnpm-workspace.yaml` raíz incluye la biblioteca y este ejemplo, por lo que pnpm enlaza `ai-i18n-tools` mediante `"ai-i18n-tools": "workspace:^"` en `package.json`. No se necesita un paso separado de compilación o enlace: después de cambiar las fuentes de la biblioteca, ejecute `pnpm run build` en la raíz del repositorio y el ejemplo cargará automáticamente la versión actualizada de `dist/`.

**Directorio de trabajo:** Ejecute la aplicación Next.js y todos los comandos de `pnpm run i18n:*` desde `**examples/nextjs-app`** (donde se encuentra `ai-i18n-tools.config.json`), o pase `--config` / establezca el directorio de trabajo para que la CLI resuelva esa configuración.

## Uso

### Aplicación Next.js (puerto 3030)

Desde la raíz del repositorio después de `pnpm install`:

```bash
cd examples/nextjs-app
```

Servidor de desarrollo:

```bash
pnpm dev
```

Compilación para producción e inicio:

```bash
pnpm build
pnpm start
```

Abra [http://localhost:3030](http://localhost:3030). Use el menú desplegable **Configuración regional** para cambiar de idioma (ID de configuración regional / nombre en inglés / etiqueta nativa). También puede enlazar directamente a una configuración regional con la cadena de consulta `**?locale=<code>`** (por ejemplo, `[?locale=ar](http://localhost:3030/?locale=ar)`); la página mantiene sincronizados el desplegable y la URL.

### Ejemplo de plurales cardinales

La página de inicio incluye una **demostración de plurales** ("Plurales: ejemplo de uso de generación automática") que muestra cómo se conectan de extremo a extremo las cadenas de interfaz de usuario para **plurales cardinales**:

- **Renderizado:** El mismo mensaje se repite para varios conteos de ejemplo definidos en `**PLURAL_DEMO_COUNTS`** en `[src/app/page.tsx](../src/app/page.tsx)` (por defecto **1**, **2**, **5** y **50**) para que pueda comparar el comportamiento plural entre configuraciones regionales (incluidos idiomas con varias formas plurales, como el árabe).
- **API:** Cada línea usa `t("This page has {{count}} sections", { plurals: true, count })`. Pase `**plurals: true`** para que la extracción y traducción traten la clave como un grupo plural; `**count**` selecciona la forma plural activa en tiempo de ejecución.
- **Tiempo de ejecución:** Las formas plurales se resuelven en tiempo de ejecución mediante los ayudantes configurados en `[src/lib/i18n.ts](../src/lib/i18n.ts)`; consulte la documentación de **runtime** del paquete (`ai-i18n-tools/runtime`) para obtener una visión completa.
- **Salidas:** Las configuraciones regionales objetivo usan entradas con sufijo en `public/locales/<locale>.json`; la configuración regional de origen mantiene los paquetes plurales en `**public/locales/en-GB.json`** junto con las entradas planas habituales.

La demostración también muestra un pequeño **bloque de código gris** con el fragmento JSX encima de los ejemplos en vivo para referencia rápida.

La página de inicio también muestra una **demostración SVG** en la parte inferior. La URL de la imagen sigue `public/assets/translation_demo_svg.<locale>.svg` (diseño plano del bloque `svg` en `ai-i18n-tools.config.json`). Después de ejecutar `translate-svg`, cada archivo de idioma contiene contenido traducido `<text>`, `<title>` y `<desc>`; hasta entonces, las copias confirmadas pueden parecer idénticas entre distintos idiomas.

### Sitio de documentación (puerto 3040)

```bash
cd examples/nextjs-app/docs-site
pnpm install
pnpm build
pnpm start
```

Si no se abre automáticamente, abra su navegador y vaya a [http://localhost:3040](http://localhost:3040).

## Idiomas compatibles

| Código    | Idioma             |
| ------- | -------------------- |
| `ar`    | Árabe               |
| `en-GB` | Inglés (Reino Unido), predeterminado |
| `fr`     | Francés                |
| `de`     | Alemán                 |
| `pt-BR`  | Portugués (Brasil)     |
| `es`     | Español                |

## Flujo de trabajo

### 1. Extraer cadenas de la interfaz

Analiza `src/` en busca de llamadas a `t()` y actualiza `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. Traducir

Establezca `OPENROUTER_API_KEY`, luego desde `**examples/nextjs-app**` ejecute todos los pasos de traducción (JSON plano de interfaz → recursos SVG → documentación) en orden:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate
```

Para ejecutar solo una etapa, use la CLI (mismo directorio de trabajo):

```bash
ai-i18n-tools translate-ui
ai-i18n-tools translate-svg
ai-i18n-tools translate-docs
```

### Comando de sincronización

El comando de sincronización ejecuta la extracción y todos los pasos de traducción en secuencia:

```bash
pnpm run i18n:sync
```

o

```bash
ai-i18n-tools sync
```

Los pasos se ejecutan en orden:

1. `**ai-i18n-tools extract**` — extrae cadenas de interfaz y actualiza `locales/strings.json`.
2. `**ai-i18n-tools translate-ui**` — escribe JSON plano por configuración regional en `public/locales/` a partir de `locales/strings.json`.
3. `**ai-i18n-tools translate-svg**` — traduce recursos SVG desde `images/` a `public/assets/` cuando `features.translateSVG` es verdadero y el bloque `svg` está establecido en `ai-i18n-tools.config.json` (este ejemplo usa nombres planos: `translation_demo_svg.<locale>.svg`).
4. `**ai-i18n-tools translate-docs**` — traduce el markdown de Docusaurus y el JSON relacionado en `docs-site/i18n/` (según `documentations[]` en `ai-i18n-tools.config.json`; vea **Flujo de trabajo 2** en `docs/GETTING_STARTED.md` en la raíz del repositorio).

Puede ejecutar cualquier paso individualmente (por ejemplo, `ai-i18n-tools translate-svg`) cuando solo hayan cambiado las fuentes de ese flujo de trabajo.

Si los registros muestran muchos saltos y pocas escrituras, la herramienta está reutilizando **salidas existentes** y la **caché SQLite** en `.translation-cache/`. Para forzar la re-traducción, pase `--force` o `--force-update` en el comando correspondiente donde esté soportado, o ejecute `**pnpm run i18n:clean`** (elimina **solo** `.translation-cache/` en esta carpeta) y traduzca nuevamente.

Este ejemplo tiene `features.translateSVG` y un bloque `svg`, por lo que `**i18n:sync` ejecuta el mismo paso SVG que `translate-svg`**. Aún puede llamar a `ai-i18n-tools translate-svg` por separado para ese paso, o usar `pnpm run i18n:translate` para el orden fijo interfaz → SVG → documentación **sin** ejecutar **extract**.

### 3. Limpiar la caché y volver a traducir

Después de realizar cambios en la interfaz de usuario o en la documentación, algunas entradas de la caché pueden estar obsoletas o huérfanas (por ejemplo, si un documento fue eliminado o renombrado). `i18n:cleanup` ejecuta primero `sync --force-update`, y luego elimina las entradas obsoletas:

```bash
pnpm run i18n:cleanup
```

Para forzar la re-traducción de la interfaz de usuario, documentos o SVGs, use `--force`. Esto ignora la caché y vuelve a traducir utilizando modelos de IA.

Para re-traducir todo el proyecto (UI, documentos, SVGs):

```bash
pnpm run i18n:sync --force
```

Para re-traducir un solo idioma:

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Para re-traducir solo las cadenas de interfaz de usuario de un idioma específico:

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Ediciones manuales (Editor de caché)

Puede iniciar una interfaz web local para revisar y editar manualmente traducciones en la caché, cadenas de interfaz y glosario (desde `**examples/nextjs-app**`):

```bash
pnpm run i18n:editor
```

Desde `**docs-site/**`, `**pnpm run i18n:editor**` hace lo mismo (apunta `cd`s a esta carpeta y ejecuta la CLI).

> **Importante:** Si edita manualmente una entrada en el editor de caché, debe ejecutar un `sync --force-update` (por ejemplo, `pnpm run i18n:sync --force-update`) para volver a escribir los archivos planos generados o los archivos markdown con la traducción actualizada. Tenga en cuenta también que si el texto fuente original cambia en el futuro, su edición manual se perderá, ya que la herramienta generará un nuevo hash para el nuevo texto fuente.

## Estructura del proyecto

```text
nextjs-app/
├── ai-i18n-tools.config.json # UI, docs, svg, glossary; `cacheDir`: .translation-cache/
├── glossary-user.csv         # Optional user glossary (see config `glossary.userGlossary`)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── i18n.ts
├── images/
│   └── translation_demo_svg.svg   # Source SVG for translate-svg
├── locales/
│   ├── ui-languages.json
│   └── strings.json          # Generated string catalogue (extract)
├── public/locales/           # Flat per-locale JSON (committed; regenerate with translate-ui)
│   ├── en-GB.json            # Source locale bundle (includes plural keys)
│   ├── ui-languages.json     # Copied/served for runtime if needed
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   ├── pt-BR.json
│   └── ar.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
├── translated-docs/          # README translations (flat markdown; second `documentations` block)
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # English sources for this example (curated subset)
    ├── docusaurus.config.mjs
    └── i18n/                 # Translated docs + Docusaurus JSON catalogs (committed in git)
```

El markdown en inglés para el sitio de ejemplo se encuentra en `**docs-site/docs/**`. No existe una sincronización automática desde la raíz del repositorio `**docs/**`; actualice esos archivos directamente al renovar el contenido. Para anclajes de encabezados estables, use `**write-heading-ids**` de Docusaurus desde `**docs-site/**` (consulte `**pnpm run write-heading-ids**` en `[docs-site/package.json](../docs-site/package.json)`).

Las cadenas de interfaz traducidas, los SVG de demostración, las traducciones de la raíz `README`, y las salidas de Docusaurus se confirman en `public/locales/`, `public/assets/`, `locales/strings.json`, `translated-docs/` y `docs-site/i18n/`. Después de cambiar las fuentes y ejecutar `**pnpm run i18n:translate**` o `**pnpm run i18n:sync**`, reinicie los servidores de desarrollo de Next.js y Docusaurus según sea necesario. El enrutamiento por configuración regional y `**localeConfigs**` están definidos en `**docs-site/docusaurus.config.mjs**`.
