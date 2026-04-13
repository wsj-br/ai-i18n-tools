# Ejemplo de aplicación Next.js

Este ejemplo muestra cómo usar `ai-i18n-tools` con una aplicación **TypeScript** [Next.js](https://nextjs.org/) y **pnpm**. La interfaz de usuario coincide con el [ejemplo de aplicación de consola](../../console-app/), utilizando las mismas claves de cadena y un selector de configuración regional impulsado por `locales/ui-languages.json` (la configuración regional de origen `en-GB` primero, seguida de los idiomas de destino de traducción).

Anidado bajo esta carpeta hay un pequeño sitio **[Docusaurus](https://docusaurus.io/)** ([`docs-site/`](../docs-site/)) con copias de la documentación principal del proyecto para navegación local.

<small>**Leer en otros idiomas:** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [pt-BR](./README.pt-BR.md)</small>

## Captura de pantalla

![screenshot](../images/screenshots/es/screenshot.png)

## Requisitos

- Node.js >= 18
- [pnpm](https://pnpm.io/)
- Una clave API de [OpenRouter](https://openrouter.ai) (para generar traducciones)

## Instalación

Desde la **raíz del repositorio**, ejecuta:

```bash
pnpm install
```

El archivo `pnpm-workspace.yaml` raíz incluye la biblioteca y este ejemplo, por lo que pnpm enlaza `ai-i18n-tools` mediante `"ai-i18n-tools": "workspace:^"` en `package.json`. No se necesita ningún paso de compilación o enlace por separado: después de cambiar las fuentes de la biblioteca, ejecuta `pnpm run build` en la raíz del repositorio y el ejemplo tomará automáticamente el `dist/` actualizado.

## Uso

### Aplicación Next.js (puerto 3030)

Servidor de desarrollo:

```bash
pnpm dev
```

Compilación de producción e inicio:

```bash
pnpm build
pnpm start
```

Abre [http://localhost:3030](http://localhost:3030). Usa el menú desplegable **Configuración regional** para cambiar el idioma (ID de configuración regional / nombre en inglés / etiqueta nativa).

La página de inicio también muestra un **SVG de demostración** en la parte inferior. La URL de la imagen sigue `public/assets/translation_demo_svg.<locale>.svg` (diseño plano del bloque `svg` en `ai-i18n-tools.config.json`). Después de ejecutar `translate-svg`, cada archivo de configuración regional contiene el contenido traducido `<text>`, `<title>` y `<desc>`; hasta entonces, las copias confirmadas pueden parecer idénticas en todas las configuraciones regionales.

### Sitio de documentación (puerto 3040)

```bash
cd docs-site
pnpm install
pnpm start
```

Abre [http://localhost:3040](http://localhost:3040) (inglés). En **desarrollo**, Docusaurus sirve **una configuración regional a la vez**: rutas como `/es/getting-started` devuelven **404** a menos que ejecutes `pnpm run start:es` (o `start:fr`, `start:de`, `start:pt-BR`). Después de `pnpm build && pnpm serve`, todas las configuraciones regionales están disponibles. Consulta [`docs-site/README.md`](../README.md).

## Idiomas admitidos

| Código   | Idioma                |
| -------- | --------------------- |
| `en-GB`  | Inglés (RU) predeterminado |
| `es`     | Español               |
| `fr`     | Francés               |
| `de`     | Alemán                |
| `pt-BR`  | Portugués (Brasil)    |

## Flujo de trabajo

### 1. Extraer cadenas de UI

Escanea `src/` en busca de llamadas a `t()` y actualiza `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. Traducir

Establece `OPENROUTER_API_KEY`, luego ejecuta los scripts de traducción:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate-ui
pnpm run i18n:translate-svg
pnpm run i18n:translate-docs
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

1. **`ai-i18n-tools extract`** — extrae cadenas de UI y actualiza `locales/strings.json`.
2. **`ai-i18n-tools translate-ui`** — escribe JSON de locales planos bajo `public/locales/` desde `locales/strings.json`.
3. **`ai-i18n-tools translate-svg`** — traduce activos SVG de `images/` a `public/assets/` según el bloque `svg` en `ai-i18n-tools.config.json` (este ejemplo utiliza nombres planos: `translation_demo_svg.<locale>.svg`).
4. **`ai-i18n-tools translate-docs`** — traduce markdown de Docusaurus bajo `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (ver **Flujo de trabajo 2** en `docs/GETTING_STARTED.md` en la raíz del repositorio).

Puedes ejecutar cualquier paso individualmente (por ejemplo, `ai-i18n-tools translate-svg`) cuando solo han cambiado las fuentes para ese flujo de trabajo.

Si los registros muestran muchos saltos y pocas escrituras, la herramienta está reutilizando **salidas existentes** y la **caché de SQLite** en `.translation-cache/`. Para forzar la retraducción, pasa `--force` o `--force-update` en el comando relevante donde sea compatible, o ejecuta `pnpm run i18n:clean` y traduce de nuevo.

Este ejemplo de configuración incluye `svg`, por lo que **`i18n:sync` ejecuta el mismo paso SVG que `translate-svg`**. Aún puedes llamar a `ai-i18n-tools translate-svg` solo para ese paso, o usar `pnpm run i18n:translate` para el orden fijo UI → SVG → docs **sin** ejecutar **extract**.

### 3. Limpiar caché y retraducir

Después de cambios en la UI o documentación, algunas entradas de caché pueden estar obsoletas u huérfanas (por ejemplo, si se eliminó o renombró un documento). `i18n:cleanup` ejecuta `sync --force-update` primero, luego elimina entradas obsoletas:

```bash
pnpm run i18n:cleanup
```

Para forzar la retraducción de la UI, documentos o SVGs, usa `--force`. Esto ignora la caché y retraduce utilizando modelos de IA.

Para retraducir todo el proyecto (UI, documentos, SVGs):

```bash
pnpm run i18n:sync --force
```

Para retraducir un solo locale:

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Para retraducir solo las cadenas de UI para un locale específico:

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Ediciones manuales (Editor de caché)

Puedes lanzar una interfaz web local para revisar y editar manualmente las traducciones en la caché, cadenas de la interfaz de usuario y glosario:

```bash
pnpm run i18n:editor
```

> **Importante:** Si editas manualmente una entrada en el editor de caché, necesitas ejecutar un `sync --force-update` (por ejemplo, `pnpm run i18n:sync --force-update`) para reescribir los archivos planos generados o archivos markdown con la traducción actualizada. También ten en cuenta que si el texto fuente original cambia en el futuro, tu edición manual se perderá ya que la herramienta genera un nuevo hash para el nuevo texto fuente.

## Estructura del Proyecto

```
nextjs-app/
├── ai-i18n-tools.config.json # `svg` block: images/ → public/assets/ (translate-svg)
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
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   └── pt-BR.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # Source (English)
    └── i18n/                 # Translated docs (Docusaurus layout; committed in git)
```

Las fuentes de documentos en inglés bajo `docs-site/docs/` pueden ser sincronizadas desde la raíz del repositorio con `pnpm run sync-docs`, lo que añade anclas de encabezado `{#slug}` y refleja `docusaurus write-heading-ids`; consulta el encabezado del script en `scripts/sync-docs-to-nextjs-example.mjs`.

Las cadenas de interfaz de usuario traducidas, SVGs de demostración y páginas de Docusaurus ya están comprometidas bajo `public/locales/`, `public/assets/`, `locales/strings.json`, y `docs-site/i18n/`. Después de cambiar las fuentes y ejecutar `i18n:translate`, reinicia los servidores de desarrollo de Next.js y Docusaurus según sea necesario; los locales de Docusaurus están listados en `docs-site/docusaurus.config.js`.
