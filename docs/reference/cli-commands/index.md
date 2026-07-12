<a id="cli-reference"></a>
# CLI reference

Run `ai-i18n-tools <command> --help` for every flag on a command. Group pages below add context, key options, and links to topic guides.

<a id="command-overview"></a>
## Command overview

<a id="setupsetup"></a>
### [Setup](setup)

| Command | Summary |
|---------|---------|
| [`version`](setup#version) | Print CLI version and build timestamp. |
| [`init`](setup#init) | Write a starter config; `-t` selects a scaffold template. |

<a id="models--catalogmodels"></a>
### [Models & catalog](models)

| Command | Summary |
|---------|---------|
| [`check-models`](models#check-models) | Validate configured model ids against the active provider. |
| [`list-models`](models#list-models) | List models advertised by the active provider. |
| [`bench-models`](models#bench-models) | Benchmark configured models on one sample translation. |
| [`list-languages`](models#list-languages) | List the bundled UI languages catalog. |

<a id="ui-stringsui-strings"></a>
### [UI strings](ui-strings)

| Command | Summary |
|---------|---------|
| [`extract`](ui-strings#extract) | Update `strings.json` from source literals and HTML markers. |
| [`mark-html`](ui-strings#mark-html) | Insert `data-i18n*` markers into HTML files. |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | Write `ui-languages.json` from config locales. |
| [`translate-ui`](ui-strings#translate-ui) | Translate UI strings (`strings.json` → locale JSON). |
| [`sync-ui`](ui-strings#sync-ui) | Extract, then translate UI strings. |
| [`proofread-ui`](ui-strings#proofread-ui) | Extract, then LLM-review source-locale UI strings. |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | Export `strings.json` to XLIFF 2.0. |

<a id="documentsdocuments"></a>
### [Documents](documents)

| Command | Summary |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | Translate markdown, MDX, `.astro`, and framework catalogs. |
| [`write-heading-ids`](documents#write-heading-ids) | Insert HTML anchor lines before ATX headings. |
| [`check-markdown`](documents#check-markdown) | Scan markdown/MDX for delimiter and emphasis issues. |

<a id="other-contentcontent"></a>
### [Other content](content)

| Command | Summary |
|---------|---------|
| [`translate-json`](content#translate-json) | Translate nested JSON per `json[]` config blocks. |
| [`translate-svg`](content#translate-svg) | Translate SVG files configured in `config.svg`. |

<a id="workflows--statusworkflows"></a>
### [Workflows & status](workflows)

| Command | Summary |
|---------|---------|
| [`sync`](workflows#sync) | Run extract + UI + SVG + docs + JSON in one pipeline. |
| [`status`](workflows#status) | Print UI, documentation, and JSON translation coverage. |
| [`statistics`](workflows#statistics) | Print cache and `strings.json` statistics. |

<a id="cache--maintenancemaintenance"></a>
### [Cache & maintenance](maintenance)

| Command | Summary |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | Prune stale cache rows and repopulate markdown issues. |
| [`clean-temp`](maintenance#clean-temp) | Find and delete `*.log`, `*.tmp`, and cache backups. |
| [`purge-locale`](maintenance#purge-locale) | Remove cache rows and generated artifacts for locale(s). |

<a id="toolstools"></a>
### [Tools](tools)

| Command | Summary |
|---------|---------|
| [`dashboard`](tools#dashboard) | Launch the Translation Dashboard web UI. |
| [`glossary-generate`](tools#glossary-generate) | Write an empty `glossary-user.csv` template. |
| [`help`](tools#help) | Display help for a subcommand. |

<a id="synopsis"></a>
## Synopsis

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
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
### Root and global options

| Option                       | Scope         | Description                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Root program  | Output version number and build timestamp (same information as the `version` subcommand). |
| `-h` / `--help`              | Root program  | Display help for the root program or for a subcommand when used with a command name.      |
| `-c` / `--config <path>`     | Every command | Config file path (default: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Every command | Verbose logging.                                                                          |
| `-P` / `--provider <name>`   | Every command | Active LLM provider for this run; overrides the config `provider` key. Must be configured under `providers`. |
| `-L` / `--ui-lang <code>`    | Every command | Language for the tool's own UI (CLI help, logs/summaries, dashboard); highest-priority source. See [Tool UI language](/guide/tool-ui-language). |
| `-w` / `--write-logs [path]` | Selected commands | Tee console output to a `.log` file (default path: under root `cacheDir`). Wired for `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, and `cleanup` only.                |

<a id="per-command-help"></a>
### Per-command help

| Usage                            | Description                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | All options for that command.      |
| `ai-i18n-tools help <command>`   | Same output as `<command> --help`. |

<a id="target-locales--l----locale"></a>
### Target locales (`-l` / `--locale`)

| Commands                                                                                | Behaviour                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — comma-separated target BCP-47 codes (e.g. `de,fr,pt-BR`). When omitted, defaults come from config (`json[]` blocks may also set per-block `targetLocales`; UI steps use `targetLocales` minus `sourceLocale`). |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — single source locale to review (default: config `sourceLocale`).                                                            |
