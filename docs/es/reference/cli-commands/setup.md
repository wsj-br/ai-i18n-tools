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

`-P` / `--provider` es obligatorio. Selecciona qué **preajuste integrado** generar. Debe ser uno de los siguientes: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apikeyfan`, `cheaperinference`, `ollama`.

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
| `ui-dotnet` | Cadenas de interfaz de usuario de .NET, JSON plano con claves basadas en la cadena del idioma de origen, y `I18n.cs` |
| `ui-dotnet-resx` | Cadenas de interfaz de usuario de .NET como satélites `.resx` (`flatOutput: false`) y `I18nResx.cs` |

`--with-readme` añade un bloque de documentación `README.md` (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, un `languageListBlock`) y establece `features.translateDocs` en true. No hace nada cuando un bloque de documentación ya lista `README.md`, lo cual ocurre con `ui-markdown` y `docs-markdown`. Solo escribe la configuración. Imprime la línea de marcador para pegar en `README.md` y advierte si falta ese archivo. Guía: [Añadir i18n a tus documentos README y Markdown](/es/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` crea un `.translate-ignore` inicial (incluyendo el entorno virtual de Python y los directorios de caché).

`init` también crea `.gitignore` en el directorio de trabajo, o lo añade a él. Las líneas añadidas son `.translation-cache/*`, `!.translation-cache/cache.db`, `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` y `*.backup.*`, cada una bajo un breve comentario. Las líneas ya presentes se mantienen como están, y una segunda ejecución no las duplica.

`ui-python`, `ui-python-gettext` y `ui-python-flask` también escriben `i18n.py` cuando ese archivo falta. Los proyectos de Django mantienen su propio tiempo de ejecución de gettext de Django, por lo que `ui-python-django` no escribe `i18n.py`. `ui-dotnet` escribe `I18n.cs` cuando ese archivo falta e imprime el elemento `EmbeddedResource` para añadir a `.csproj`. `ui-dotnet-resx` escribe `I18nResx.cs` en su lugar y apunta `ui.resx` a `Resources/SharedResource.<culture>.resx`. `--namespace` anula el espacio de nombres de C#. Guía: [Aplicaciones .NET](/es/guide/ui-strings/dotnet) y [Añadir i18n a una aplicación .NET ResourceManager](/es/guide/add-i18n-to-dotnet-resourcemanager).

`migrate-python-i18n` reescribe las llamadas preevaluadas no seguras (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) en llamadas de búsqueda antes de formato. El valor predeterminado es una ejecución de prueba. Pase `--write` para editar archivos y lea `migrate-python-i18n-report.md` para notas de revisión. Una expresión compleja se nombra a partir de la expresión cuando esta es estable (`start.isoformat()` se convierte en `{start}`, `len(rows)` se convierte en `{rows_count}`). Se informa de un `{value_1}` restante para que pueda ser renombrado. Los archivos `i18n.py` generados se omiten. Un informe limpio no significa que las f-strings desenvueltas estuvieran cubiertas.

`migrate-dotnet-i18n` hace lo mismo para `T($"...")`, la concatenación y `string.Format` dentro de `T()`. `--wrap` también marca las etiquetas XAML sin marcar y los sumideros C# de alta confianza; sin `--write`, eso es una auditoría. El informe es `migrate-dotnet-i18n-report.md`. Los `I18n.cs` y `I18nResx.cs` generados se omiten. Guía: [Aplicaciones .NET](/es/guide/ui-strings/dotnet#rewrite-unsafe-calls).

---

<a id="doctor"></a>
### `doctor`

**Sinopsis:** `ai-i18n-tools doctor [--local] [--strict] [--json] [--fix-gitignore]`

Compruebe que el proyecto está listo para traducir. El informe cubre la sintaxis y el esquema de configuración, las reglas de negocio, la versión instalada, las rutas de origen y de salida, los archivos de catálogo de la interfaz de usuario, las discrepancias de marcadores de posición en esos catálogos, las estadísticas de caché, los proveedores configurados, las variables de entorno compatibles que están establecidas y los ID de modelo. Un catálogo con un marcador de posición renombrado, eliminado o reescrito es una advertencia y nombra un ejemplo.

De forma predeterminada, `doctor` también verifica los ID de modelo configurados con el catálogo del proveedor activo y compara la versión instalada con la última versión de GitHub. `--local` omite ambas llamadas de red. Una versión más reciente, o una solicitud de GitHub que falla, es una advertencia. Un ID de modelo faltante o caducado hace que el comando falle. `--strict` sale con un error cuando alguna verificación emite una advertencia.

Los valores de las claves de API nunca se imprimen. Las variables configuradas se listan en orden alfabético como `Configured variables: NAME, ...`. Una variable que no es una clave de API incluye su valor.

Las rutas de entrada que faltan fallan. La ausencia de directorios de salida es una nota, ya que la primera ejecución de traducción los crea. `doctor` no reescribe la configuración, no crea directorios ni envía el texto de origen a un modelo. `--fix-gitignore` añade las líneas `.gitignore` que faltan y deja todos los demás archivos intactos.

`doctor` advierte cuando a `.gitignore` junto a la configuración le falta un patrón requerido. La advertencia te indica que ejecutes `ai-i18n-tools doctor --fix-gitignore`. Cuando `.gitignore` ya existe, añade una línea en blanco, el comentario `# ai-i18n-tools doctor fix` y solo las líneas que faltan. No duplica las líneas ya presentes. Se crea un archivo que falta con el mismo bloque que escribe `init`. Los dos patrones de caché siguen la `cacheDir` configurada, por lo que `.i18n-cache` necesita `.i18n-cache/*` y `!.i18n-cache/cache.db` en lugar de las líneas `.translation-cache` predeterminadas. Los otros patrones son `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` y `*.backup.*`. Una línea que ignora el propio directorio de caché, como `.i18n-cache/`, también es una advertencia, porque Git no rastreará `cache.db` bajo un directorio ignorado. `--fix-gitignore` no elimina esa línea. La advertencia hace que el comando falle solo con `--strict`.

**Opciones clave:** `--local`, `--strict`, `--json`, `--fix-gitignore`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
ai-i18n-tools doctor --fix-gitignore
```

---

<a id="help"></a>
### `help`

**Resumen:** `ai-i18n-tools help [command]`

Mostrar ayuda para un subcomando (misma salida que `ai-i18n-tools <command> --help`).
