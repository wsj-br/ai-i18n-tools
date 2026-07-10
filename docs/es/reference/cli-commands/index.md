<a id="cli-reference"></a>
# Referencia de la CLI

Ejecute `ai-i18n-tools <command> --help` para cada indicador en un comando. Las páginas siguientes añaden contexto, opciones clave y enlaces a guías temáticas.

<a id="command-overview"></a>
## Descripción general de los comandos

<a id="setupsetup"></a>
### [Configuración](setup)

| Comando | Resumen |
|---------|---------|
| [`version`](setup#version) | Imprime la versión de la CLI y la marca de tiempo de compilación. |
| [`init`](setup#init) | Escribe una configuración inicial; `-t` selecciona una plantilla de andamiaje. |

<a id="models--catalogmodels"></a>
### [Modelos y catálogo](models)

| Comando | Resumen |
|---------|---------|
| [`check-models`](models#check-models) | Valida los ID de modelo configurados con el proveedor activo. |
| [`list-models`](models#list-models) | Lista los modelos anunciados por el proveedor activo. |
| [`bench-models`](models#bench-models) | Compara los modelos configurados en una traducción de muestra. |
| [`list-languages`](models#list-languages) | Lista el catálogo de idiomas de la interfaz de usuario incluido. |

<a id="ui-stringsui-strings"></a>
### [Cadenas de interfaz de usuario](ui-strings)

| Comando | Resumen |
|---------|---------|
| [`extract`](ui-strings#extract) | Actualiza `strings.json` a partir de literales de origen y marcadores HTML. |
| [`mark-html`](ui-strings#mark-html) | Inserta marcadores `data-i18n*` en archivos HTML. |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | Escribe `ui-languages.json` a partir de configuraciones regionales. |
| [`translate-ui`](ui-strings#translate-ui) | Traduce cadenas de interfaz de usuario (`strings.json` → JSON de configuración regional). |
| [`sync-ui`](ui-strings#sync-ui) | Extrae y luego traduce cadenas de interfaz de usuario. |
| [`proofread-ui`](ui-strings#proofread-ui) | Extrae y luego revisa con LLM las cadenas de interfaz de usuario de la configuración regional de origen. |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | Exporta `strings.json` a XLIFF 2.0. |

<a id="documentsdocuments"></a>
### [Documentos](documents)

| Comando | Resumen |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | Traduce markdown, MDX, `.astro` y catálogos de frameworks. |
| [`write-heading-ids`](documents#write-heading-ids) | Inserta líneas de anclaje HTML antes de los encabezados ATX. |
| [`check-markdown`](documents#check-markdown) | Escanea markdown/MDX en busca de problemas de delimitadores y énfasis. |

<a id="other-contentcontent"></a>
### [Otro contenido](content)

| Comando | Resumen |
|---------|---------|
| [`translate-json`](content#translate-json) | Traduce JSON anidado según los bloques de configuración de `json[]`. |
| [`translate-svg`](content#translate-svg) | Traduce archivos SVG configurados en `config.svg`. |

<a id="workflows--statusworkflows"></a>
### [Flujos de trabajo y estado](workflows)

| Comando | Resumen |
|---------|---------|
| [`sync`](workflows#sync) | Ejecuta la extracción + UI + SVG + documentos + JSON en una sola canalización. |
| [`status`](workflows#status) | Imprime la cobertura de traducción de la UI, la documentación y JSON. |
| [`statistics`](workflows#statistics) | Imprime las estadísticas de la caché y de `strings.json`. |

<a id="cache--maintenancemaintenance"></a>
### [Caché y mantenimiento](maintenance)

| Comando | Resumen |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | Elimina las filas de caché obsoletas y vuelve a rellenar los problemas de markdown. |
| [`clean-temp`](maintenance#clean-temp) | Busca y elimina `*.log`, `*.tmp` y las copias de seguridad de la caché. |
| [`purge-locale`](maintenance#purge-locale) | Elimina las filas de caché y los artefactos generados para las configuraciones regionales. |

<a id="toolstools"></a>
### [Herramientas](tools)

| Comando | Resumen |
|---------|---------|
| [`dashboard`](tools#dashboard) | Inicia la interfaz de usuario web del Panel de control de traducción. |
| [`glossary-generate`](tools#glossary-generate) | Escribe una plantilla `glossary-user.csv` vacía. |
| [`help`](tools#help) | Muestra la ayuda para un subcomando. |

<a id="synopsis"></a>
## Sinopsis

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### Opciones raíz y globales

| Opción                       | Alcance         | Descripción                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Programa raíz  | Muestra el número de versión y la marca de tiempo de compilación (misma información que el subcomando `version`). |
| `-h` / `--help`              | Programa raíz  | Muestra la ayuda para el programa raíz o para un subcomando cuando se usa con un nombre de comando.      |
| `-c` / `--config <path>`     | Todos los comandos | Ruta del archivo de configuración (por defecto: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Todos los comandos | Registro detallado (verbose logging).                                                                          |
| `-P` / `--provider <name>`   | Cada comando | Proveedor de LLM activo para esta ejecución; anula la clave `provider` de la configuración. Debe configurarse en `providers`. |
| `-L` / `--ui-lang <code>` | Cada comando | Idioma de la interfaz de usuario de la herramienta (ayuda de la CLI, registros/resúmenes, panel); fuente de mayor prioridad. Consulte [Idioma de la interfaz de usuario de la herramienta](/guide/tool-ui-language). |
| `-w` / `--write-logs [path]` | Comandos seleccionados | Envía la salida de la consola a un archivo `.log` (ruta predeterminada: bajo la raíz `cacheDir`). Cableado solo para `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync` y `cleanup`. |

<a id="per-command-help"></a>
### Ayuda por comando

| Uso                            | Descripción                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Todas las opciones para ese comando.      |
| `ai-i18n-tools help <command>`   | Mismo resultado que `<command> --help`. |

<a id="target-locales--l----locale"></a>
### Configuraciones regionales de destino (`-l` / `--locale`)

| Comandos | Comportamiento |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — códigos BCP-47 de destino separados por comas (por ejemplo, `de,fr,pt-BR`). Cuando se omite, los valores predeterminados provienen de la configuración (los bloques `json[]` también pueden establecer `targetLocales` por bloque; los pasos de la interfaz de usuario usan `targetLocales` menos `sourceLocale`). |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — locale de origen única a revisar (predeterminado: configuración `sourceLocale`).                                                            |
