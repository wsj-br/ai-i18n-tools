# Ejemplo de aplicación Next.js

Este ejemplo muestra cómo usar `ai-i18n-tools` con una aplicación **TypeScript** [Next.js](https://nextjs.org/) y pnpm. La interfaz coincide con el [ejemplo de aplicación de consola](../../console-app/), utilizando las mismas claves de cadena y un selector de configuración regional controlado por `locales/ui-languages.json` (primero la configuración regional de origen `en-GB`, seguida de los objetivos de traducción). `[src/lib/i18n.ts](../src/lib/i18n.ts)` genera `localeLoaders` a partir de ese manifiesto (todas las `code` excepto `SOURCE_LOCALE`), como en la aplicación de consola; los paquetes se cargan con `fetch` a `public/locales/<locale>.json`.

Anidado bajo esta carpeta hay un pequeño sitio [Docusaurus](https://docusaurus.io/) (`[docs-site/](../docs-site/)`) con un subconjunto seleccionado de la documentación del proyecto principal para navegación local.

**Leer en otros idiomas:**
[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

## Captura de pantalla

captura de pantalla

## Requisitos

- Node.js >= 22.16 (coincide con el campo `engines` del repositorio)
- [pnpm](https://pnpm.io/) >= 10.33 (ver el `package.json` `packageManager` / `engines` raíz)
- Una clave de API de [OpenRouter](https://openrouter.ai) (para generar traducciones)

## Instalación

### Prueba este ejemplo por separado

```bash
npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app
cd nextjs-app
pnpm install
```

### Colaboradores del monorepositorio

Desde la raíz del repositorio, ejecute:

```bash
pnpm install
```

La entrada del espacio de trabajo [`overrides`](../../../pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) fuerza a `ai-i18n-tools` a usar la copia local del espacio de trabajo aunque este ejemplo declare `"ai-i18n-tools": "^1.7.2"`. No se necesita ningún paso adicional de compilación o enlace: después de cambiar las fuentes de la biblioteca, ejecuta `pnpm run build` en la raíz del repositorio y el ejemplo cargará automáticamente la versión actualizada de `dist/`.

**Directorio de trabajo:** Ejecute la aplicación Next.js y todos los comandos de `pnpm run i18n:*` desde `examples/nextjs-app` (donde reside `ai-i18n-tools.config.json`), o pase `--config` / establezca el directorio de trabajo para que la CLI resuelva esa configuración.

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

Abra [http://localhost:3030](http://localhost:3030). Use el menú desplegable de configuración regional para cambiar el idioma (ID de configuración regional / nombre en inglés / etiqueta nativa). También puede enlazar directamente a una configuración regional mediante la cadena de consulta `?locale=<code>` (por ejemplo, `[?locale=ar](http://localhost:3030/?locale=ar)`); la página mantiene sincronizados el menú desplegable y la URL.

### Ejemplo de plurales cardinales

La página de inicio incluye una demostración de plurales ("Plurales: ejemplo de uso de generación automática") que muestra cómo se conectan de extremo a extremo las cadenas de interfaz de usuario plurales cardinales:

- **Representación:** El mismo mensaje se repite para varios conteos de ejemplo definidos en `PLURAL_DEMO_COUNTS` en `[src/app/page.tsx](../src/app/page.tsx)` (por defecto 1, 2, 5 y 50) para que pueda comparar el comportamiento plural entre configuraciones regionales (incluidos idiomas con varias formas plurales, como el árabe).
- **API:** Cada línea utiliza `t("This page has {{count}} sections", { plurals: true, count })`. Pase `plurals: true` para que la extracción y traducción traten la clave como un grupo plural; `count` selecciona la forma plural activa en tiempo de ejecución.
- **Tiempo de ejecución:** Las formas plurales se resuelven en tiempo de ejecución mediante los ayudantes configurados en `[src/lib/i18n.ts](../src/lib/i18n.ts)`; consulte la documentación de tiempo de ejecución del paquete (`ai-i18n-tools/runtime`) para obtener una visión completa.
- **Salidas:** Las configuraciones regionales objetivo utilizan entradas con sufijo en `public/locales/<locale>.json`; la configuración regional de origen mantiene los paquetes plurales en `public/locales/en-GB.json` junto con las entradas planas habituales.

La demostración también muestra un pequeño bloque de código gris con el fragmento JSX encima de los ejemplos en vivo para referencia rápida.

La página de inicio también muestra una demostración SVG en la parte inferior. La URL de la imagen sigue `public/assets/translation_demo_svg.<locale>.svg` (diseño plano del bloque `svg` en `ai-i18n-tools.config.json`). Después de ejecutar `translate-svg`, cada archivo de configuración regional contiene contenido traducido `<text>`, `<title>` y `<desc>`; hasta entonces, las copias confirmadas pueden parecer idénticas entre configuraciones regionales.

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

Establezca `OPENROUTER_API_KEY`, luego desde ``examples/nextjs-app`` ejecute todos los pasos de traducción en orden (JSON plano de la interfaz → archivos SVG → documentación):

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

1. ``ai-i18n-tools extract`` — extrae las cadenas de la interfaz y actualiza `locales/strings.json`.
2. ``ai-i18n-tools translate-ui`` — genera JSON plano por idioma en `public/locales/` a partir de `locales/strings.json`.
3. ``ai-i18n-tools translate-svg`` — traduce los archivos SVG de `images/` a `public/assets/` cuando `features.translateSVG` es verdadero y el bloque `svg` está definido en `ai-i18n-tools.config.json` (este ejemplo usa nombres planos: `translation_demo_svg.<locale>.svg`).
4. ``ai-i18n-tools translate-docs`` — traduce el **contenido de las páginas** de Docusaurus (markdown/MDX en `docs-site/docs/`) a `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`, y cuando `features.translateJSON` y `jsonSource` están definidos, también traduce el **JSON de shell** desde `docs-site/i18n/en/` (según `documentations[]` en `ai-i18n-tools.config.json`; véase el flujo de trabajo 2 en `docs/GETTING_STARTED.md` en la raíz del repositorio).

Puede ejecutar cualquier paso individualmente (por ejemplo, `ai-i18n-tools translate-svg`) cuando solo hayan cambiado las fuentes de ese flujo de trabajo.

Si los registros muestran muchos saltos y pocas escrituras, la herramienta está reutilizando salidas existentes y la caché SQLite en `.translation-cache/`. Para forzar la re-traducción, pase `--force` o `--force-update` en el comando correspondiente donde esté soportado, o ejecute `pnpm run i18n:clean` (elimina solo `.translation-cache/` en esta carpeta) y traduzca nuevamente.

Este ejemplo tiene `features.translateSVG` y un bloque `svg`, por lo que `i18n:sync` ejecuta el mismo paso SVG que `translate-svg`. Aún puede llamar a `ai-i18n-tools translate-svg` por separado para ese paso, o usar `pnpm run i18n:translate` para el orden fijo interfaz de usuario → SVG → documentación sin ejecutar `extract`.

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

### 4. Ediciones manuales (Panel de traducción)

Puede iniciar una interfaz web local para revisar y editar manualmente traducciones en la caché, cadenas de interfaz de usuario y glosario (desde ``examples/nextjs-app``):

```bash
pnpm run i18n:dashboard
```

Desde ``docs-site/``, ``pnpm run i18n:dashboard`` hace lo mismo (`cd` a esta carpeta y ejecuta la CLI).

> **Importante:** Si editas manualmente una entrada en el Panel de traducción, debes ejecutar un `sync --force-update` (por ejemplo, `pnpm run i18n:sync --force-update`) para volver a escribir los archivos planos o los archivos markdown generados con la traducción actualizada. Ten en cuenta también que si el texto fuente original cambia en el futuro, tu edición manual se perderá, ya que la herramienta genera un nuevo hash para el nuevo texto fuente.

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

El markdown en inglés para el sitio de ejemplo reside en `docs-site/docs/`. No hay sincronización automática desde la raíz del repositorio `docs/`; actualice esos archivos directamente al renovar contenido. Para anclajes de encabezado estables, use ``write-heading-ids`` de Docusaurus desde ``docs-site/`` (vea ``pnpm run write-heading-ids`` en `[docs-site/package.json](../docs-site/package.json)`).

Las cadenas de interfaz traducidas, los SVG de demostración, las traducciones raíz de `README`, y las salidas de Docusaurus se guardan en `public/locales/`, `public/assets/`, `locales/strings.json`, `translated-docs/` y `docs-site/i18n/`. Después de cambiar las fuentes y ejecutar ``pnpm run i18n:translate`` o ``pnpm run i18n:sync``, reinicia los servidores de desarrollo de Next.js y Docusaurus según sea necesario. El enrutamiento por configuración regional y ``localeConfigs`` se definen en `docs-site/docusaurus.config.mjs`.

## Archivos de capturas de pantalla: disposición esperada

La documentación y el README de este ejemplo hacen referencia a capturas de pantalla específicas de cada configuración regional, pero no se incluyen archivos PNG reales ni un script `take-screenshots`. Este ejemplo es una demostración de configuración.

### Documentación de Docusaurus (`docs-site/docs/`)

El bloque de `documentations[]` de Docusaurus utiliza esta regla de `regexAdjustments`:

```json
{ "search": "screenshots/[^/]+/", "replace": "screenshots/${translatedLocale}/" }
```

Para que las páginas de ejemplo muestren capturas de pantalla específicas de cada configuración regional, necesitarías archivos PNG en:

```
docs-site/static/img/screenshots/
├── en-GB/
│   └── screenshot.png
├── de/
│   └── screenshot.png
├── es/
│   └── screenshot.png
├── fr/
│   └── screenshot.png
├── pt-BR/
│   └── screenshot.png
└── ar/
    └── screenshot.png
```

Un script `take-screenshots` debe capturar la aplicación en cada configuración regional y escribir en `docs-site/static/img/screenshots/<locale>/screenshot.png`. La herramienta solo reescribe las URL; no crea archivos PNG.

### README plano (`README.md` → `translated-docs/`)

El segundo bloque `documentations[]` utiliza:

```json
{ "search": "images/screenshots/es/]+/", "replace": "images/screenshots/es/" }
```

Disposición esperada:

```
images/screenshots/es/
│   └── overview.png
├── de/
├── es/
├── fr/
├── pt-BR/
└── ar/
```

### Referencias del mundo real

- [transrewrt](https://github.com/wsj-br/transrewrt) — README plano con 37 configuraciones regionales (patrón B plano), `take-screenshots.js` captura todas las configuraciones regionales
- [duplistatus](https://github.com/wsj-br/duplistatus) — capturas de pantalla coubicadas en Docusaurus (patrón C), `take-screenshots.ts` usa división `getScreenshotDir(locale)`

Consulta la [Guía de activos por configuración regional](../../../docs/LOCALE-ASSETS-GUIDE.md) para obtener documentación completa sobre los patrones.
