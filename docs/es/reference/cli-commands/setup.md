<a id="cli--getting-started"></a>
# CLI — Primeros pasos

<a id="version"></a>
### `version`

**Sinopsis:** `ai-i18n-tools version`

Imprime la versión de la CLI y la marca de tiempo de compilación (la misma información que `-V` / `--version` en el programa raíz).

---

<a id="init"></a>
### `init`

**Sinopsis:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Escriba un archivo de configuración inicial (incluye `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` y `docs[].addFrontmatter`). Los comandos de traducción que llaman a un LLM requieren la clave API del proveedor activo en el entorno o `.env` (excepto Ollama); consulte [Proveedor y clave API](/es/guide/quick-start#provider-and-api-key).

**Opciones clave:** `-P` / `--provider` (obligatorio), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` es obligatorio. Selecciona el **preajuste integrado** para generar la estructura. Debe ser uno de: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`.

**Plantillas (`-t`):**

| Valor | Genera |
|-------|-----------|
| `ui-markdown` | Cadenas de IU más README (salida plana, lista de idiomas) |
| `ui-docusaurus` | Interfaz de usuario de Docusaurus + documentos |
| `ui-starlight` | Documentos de Starlight |
| `ui-vitepress` | Documentos de VitePress (`docsOutput.style: "vitepress"`) más `vitepressThemeCatalog` para cadenas de temas |
| `ui-nextra` | Documentos de Nextra (`docsOutput.style: "nextra"`) más `nextraDictionaryPath` para el diccionario de temas (la barra lateral `_meta.ts` se recopila automáticamente) |
| `ui-fumadocs` | Documentos de Fumadocs (`docsOutput.style: "fumadocs"`) más `fumadocsUiCatalog` para anulaciones de la interfaz de usuario (la barra lateral `meta.json` se recopila automáticamente) |
| `ui-astro-website` | Cadenas de interfaz de usuario del sitio web de Astro |
| `ui-plain-html` | Catálogo HTML simple (marcadores `data-i18n*`, JSON de locale plano) |
| `docs-plain-html` | Documentos HTML simples (un archivo por locale, lista de idiomas, hreflang) |
| `docs-markdown` | Documentos Markdown: archivos README y `.md`, salida plana, lista de idiomas |
| `ui-json-bundles` | JSON (solo `json[]`) |
| `ui-python` | Cadenas de IU de Python, JSON plano indexado por la cadena del idioma de origen, y `i18n.py` |
| `ui-python-gettext` | Cadenas de interfaz de usuario de Python con JSON plano y `.po` / `.mo` de GNU, además de `i18n.py` |
| `ui-python-django` | Catálogos de `gettext` / `{% blocktrans %}` de Django (`flatOutput: false`, dominio `django`, sin `i18n.py`) |
| `ui-python-flask` | Catálogos de Flask / Jinja bajo `translations/` (`flatOutput: false`) además de `i18n.py` |

`--with-readme` añade un bloque de documentación `README.md` (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, un `languageListBlock`) y establece `features.translateDocs` en true. No hace nada cuando un bloque de documentación ya lista `README.md`, lo cual ocurre con `ui-markdown` y `docs-markdown`. Solo escribe la configuración. Imprime la línea de marcador para pegar en `README.md` y advierte si falta ese archivo. Guía: [Añadir i18n a tus documentos README y Markdown](/es/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` crea un `.translate-ignore` inicial (incluyendo el entorno virtual de Python y los directorios de caché).

`ui-python`, `ui-python-gettext` y `ui-python-flask` también escriben `i18n.py` cuando falta ese archivo. Los proyectos de Django mantienen el tiempo de ejecución gettext propio de Django, por lo que `ui-python-django` no escribe `i18n.py`.

`migrate-python-i18n` reescribe las llamadas preevaluadas no seguras (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) en llamadas de búsqueda antes de formato. El valor predeterminado es una ejecución de prueba. Pase `--write` para editar archivos y lea `migrate-python-i18n-report.md` para ver las notas de revisión. Los archivos `i18n.py` generados se omiten.

---

<a id="doctor"></a>
### `doctor`

**Sinopsis:** `ai-i18n-tools doctor [--local] [--strict] [--json]`

Verifica que el proyecto esté listo para traducir. El informe cubre la sintaxis y el esquema de configuración, las reglas de negocio, la versión instalada, las rutas de origen y de salida, los archivos de catálogo de UI, las estadísticas de caché, los proveedores configurados, las variables de entorno compatibles que están establecidas y los ID de modelo.

De forma predeterminada, `doctor` también verifica los ID de modelo configurados con el catálogo del proveedor activo y compara la versión instalada con la última versión de GitHub. `--local` omite ambas llamadas de red. Una versión más reciente, o una solicitud de GitHub que falla, es una advertencia. Un ID de modelo faltante o caducado hace que el comando falle. `--strict` sale con un error cuando alguna verificación emite una advertencia.

Los valores de las claves de API nunca se imprimen. Una clave configurada se muestra como `NAME (set)`.

Las rutas de entrada faltantes provocan un fallo. Los directorios de salida faltantes son una nota, porque la primera ejecución de traducción los crea. `doctor` no reescribe la configuración, no crea directorios ni envía texto de origen a un modelo.

**Opciones clave:** `--local`, `--strict`, `--json`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
```

---

<a id="help"></a>
### `help`

**Resumen:** `ai-i18n-tools help [command]`

Mostrar ayuda para un subcomando (misma salida que `ai-i18n-tools <command> --help`).
