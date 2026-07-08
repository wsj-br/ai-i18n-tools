<a id="json"></a>
# JSON

Diseñado para proyectos que mantienen las copias de la interfaz de usuario en **archivos JSON anidados por configuración regional** (por ejemplo, `src/i18n/en/translation.json`) en lugar de `t("…")` en el código fuente. La CLI recorre los valores de cadena en esos archivos, los traduce a través del proveedor de LLM activo y escribe las salidas por configuración regional usando `json[].outputPathTemplate`. Utiliza la misma caché de SQLite que `translate-docs` y `translate-svg` (`cacheDir`).

Este pipeline **no** ejecuta `extract`; no hay un catálogo `strings.json`. Habilítelo con `features.translateJson` y una o más entradas en el `json[]` de nivel superior.

<a id="per-locale-model-overrides"></a>
### Anulaciones de modelo por configuración regional

`translate-json` resuelve los modelos **por configuración regional de destino**: primero `localeModels(locale)` cuando está configurado, luego `translationModels`. Utilice esto para paquetes JSON anidados donde ciertas configuraciones regionales se benefician de modelos dedicados, por ejemplo, archivos de tema `zh-Hans` / `zh-Hant`. Consulte [Proveedores y modelos](/guide/providers-and-models#model-fallback-chain).

<a id="step-1-initialise-for-nested-json"></a>
### Paso 1: Inicializar para JSON anidado

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Esa plantilla establece `features.translateJson: true`, desactiva la extracción de la interfaz de usuario y la traducción de documentos, y crea un único bloque `json[]` que apunta a `src/i18n/en/translation.json` con salida `src/i18n/{llocale}/translation.json`. Edite `sourceLocale`, `targetLocales`, `contentPaths` y `outputPathTemplate` según la estructura de su repositorio.

<a id="step-2-configure-json"></a>
### Paso 2: Configurar `json[]`

Cada bloque `json[]` describe una canalización:

- `contentPaths` — uno o más archivos `.json`, directorios o patrones (por ejemplo, `"src/i18n/en/translation.json"` o `"src/i18n/en/overrides/*.json"`). Las rutas se resuelven desde la raíz del proyecto.
- `outputPathTemplate` — obligatorio. Dónde escribir cada archivo por configuración regional. Marcadores de posición: `{locale}`, `{LOCALE}`, `{llocale}` (configuración regional en minúsculas, útil para carpetas de rutas de Astro), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (opcional) — subconjunto solo para este bloque; si no, se aplica el `targetLocales` raíz.
- `keyPolicy` — qué claves JSON contienen texto traducible frente a identificadores estables (ver más abajo).
- `description` (opcional) — se muestra en los encabezados de la CLI y en la salida de `status`.

Ejemplo (múltiples archivos de origen, carpetas de configuración regional en minúsculas):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Comportamiento |
|-------------|-----------|
| `allowlist` | Solo se traducen las claves que coincidan con `translateKeys` (rutas con puntos; patrones minimatch). |
| `denylist`  | Traduce todos los valores de cadena excepto las claves que coincidan con `skipKeys`. |
| `both`      | Aplica primero `translateKeys`, luego elimina las coincidencias de `skipKeys`. |

Las rutas usan notación con puntos (`nav.home.label`). Un nombre simple como `slug` coincide con el segmento final de la clave a cualquier profundidad.

<a id="step-3-translate-json-bundles"></a>
### Paso 3: Traducir paquetes JSON

```bash
npx ai-i18n-tools translate-json
```

Marcas opcionales (mismas ideas que `translate-docs`): `-l` / `--locale` para un subconjunto de objetivos, `-p` / `--path` para limitar archivos, `--dry-run`, `--force` (borra el seguimiento de archivos y la caché de segmentos para los archivos coincidentes), `--force-update` (vuelve a procesar cuando el hash del archivo coincide; la caché de segmentos sigue aplicándose), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Los proyectos solo JSON pueden ejecutar:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Cuando también están habilitadas la interfaz de usuario o la documentación, `sync` ejecuta **translate-json después de translate-docs** (a menos que se use `--no-json`). Omita JSON con `--no-json`.

Verifique la cobertura por archivo y configuración regional:

```bash
npx ai-i18n-tools status
```

Cuando `translateJson` está activado, `status` imprime una sección `json[]` (✓ actualizada, ● obsoleta o ausente).

<a id="json-vs-other-pipelines"></a>
### JSON vs. otros pipelines

| Situación | Uso |
|-----------|-----|
| Cadenas de UI en `t("…")` / `i18n.t("…")` en JS/TS/Astro | [Cadenas de UI](/guide/ui-strings/) — `extract` + `translate-ui` |
| Catálogo Docusaurus `write-translations` (`{ "key": { "message": "…", "description": "…" } }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs`, **no** `json[]` |
| JSON de tema/navegación/barra lateral de VitePress (catálogo anidado que usted crea) | JSON — `json[]` + `translate-json`; los cuerpos de las páginas permanecen en Documentos — consulte [integración de VitePress](/guide/vitepress-integration) |
| JSON de configuración regional anidada independiente (árboles `translation.json` estilo ZenBrowser) | JSON — `json[]` + `translate-json` |
| Archivos `.svg` ilustrados con `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (opcional; no es una de las tres tuberías principales) |

Referencia de campo: [`json`](#json) en [Referencia de configuración](/reference/configuration#json). Las claves de caché para la limpieza usan `json-block:{blockIndex}:{projectRelPath}` en `file_tracking`.
