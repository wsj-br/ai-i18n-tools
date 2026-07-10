<a id="cli-reference"></a>
# CLI sandarbh

ek command par har flag ke liye `ai-i18n-tools <command> --help` chalaen. Neeche diye gaye page context, mukhya vikalpon, aur topic guide ke link jodte hain.

<a id="command-overview"></a>
## Kamannd ka avlokan

<a id="setupsetup"></a>
### [Setap](setup)

| Command | Summary |
|---------|---------|
| [`version`](setup#version) | CLI version aur build timestamp print karen. |
| [`init`](setup#init) | Ek starter config likhen; `-t` ek scaffold template chunta hai. |

<a id="models--catalogmodels"></a>
### [Modals aur kaitlog](models)

| Command | Summary |
|---------|---------|
| [`check-models`](models#check-models) | Active provider ke khilaaf configured model IDs ko validate karen. |
| [`list-models`](models#list-models) | Active provider dwara advertise kiye gaye models ki list den. |
| [`bench-models`](models#bench-models) | Ek sample translation par configured models ka benchmark karen. |
| [`list-languages`](models#list-languages) | Bundled UI languages catalog ki list den. |

<a id="ui-stringsui-strings"></a>
### [UI string](ui-strings)

| Command | Summary |
|---------|---------|
| [`extract`](ui-strings#extract) | Source literals aur HTML markers se `strings.json` update karen. |
| [`mark-html`](ui-strings#mark-html) | HTML files mein `data-i18n*` markers insert karen. |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | Config locales se `ui-languages.json` likhen. |
| [`translate-ui`](ui-strings#translate-ui) | UI strings ka anuvaad karen (`strings.json` → locale JSON). |
| [`sync-ui`](ui-strings#sync-ui) | UI strings extract karen, phir anuvaad karen. |
| [`proofread-ui`](ui-strings#proofread-ui) | UI strings extract karen, phir LLM-review source-locale UI strings. |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | `strings.json` ko XLIFF 2.0 mein export karen. |

<a id="documentsdocuments"></a>
### [Dastavez](documents)

| Command | Summary |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | Markdown, MDX, `.astro`, aur framework catalogs ka anuvaad karen. |
| [`write-heading-ids`](documents#write-heading-ids) | ATX headings se pehle HTML anchor lines insert karen. |
| [`check-markdown`](documents#check-markdown) | Delimiter aur emphasis issues ke liye markdown/MDX scan karen. |

<a id="other-contentcontent"></a>
### [Any samagri](content)

| Command | Summary |
|---------|---------|
| [`translate-json`](content#translate-json) | `json[]` config blocks ke anusaar nested JSON ka anuvaad karen. |
| [`translate-svg`](content#translate-svg) | `config.svg` mein configured SVG files ka anuvaad karen. |

<a id="workflows--statusworkflows"></a>
### [Varkflo aur sthiti](workflows)

| Command | Summary |
|---------|---------|
| [`sync`](workflows#sync) | Ek pipeline mein extract + UI + SVG + docs + JSON chalayen. |
| [`status`](workflows#status) | UI, documentation, aur JSON translation coverage print karein. |
| [`statistics`](workflows#statistics) | Cache aur `strings.json` statistics print karein. |

<a id="cache--maintenancemaintenance"></a>
### [Kaish aur rakh-rakhav](maintenance)

| Command | Summary |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | Purani cache rows ko prune karein aur markdown issues ko repopulate karein. |
| [`clean-temp`](maintenance#clean-temp) | `*.log`, `*.tmp`, aur cache backups ko dhoondhein aur delete karein. |
| [`purge-locale`](maintenance#purge-locale) | Locale(s) ke liye cache rows aur generated artifacts hatayein. |

<a id="toolstools"></a>
### [Tulz](tools)

| Command | Summary |
|---------|---------|
| [`dashboard`](tools#dashboard) | Translation Dashboard web UI launch karein. |
| [`glossary-generate`](tools#glossary-generate) | Ek khali `glossary-user.csv` template likhein. |
| [`help`](tools#help) | Ek subcommand ke liye help display karein. |

<a id="synopsis"></a>
## Saransh

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
### Root aur global vikalp

| Vikalp | Scope | Vivaran |
|---|---|---|
| `-V` / `--version` | Root program | Version number aur build timestamp output karen (`version` subcommand ke samaan jaankari). |
| `-h` / `--help` | Root program | Root program ya subcommand ke liye help dikhaen jab command name ke saath upyog kiya jaata hai. |
| `-c` / `--config <path>` | Har command | Config file path (default: `ai-i18n-tools.config.json`). |
| `-v` / `--verbose` | Har command | Verbose logging. |
| `-P` / `--provider <name>` | Har command | Is run ke liye active LLM provider; config `provider` key ko override karta hai. `providers` ke tahat configure kiya jaana chahiye. |
| `-L` / `--ui-lang <code>` | Har command | Tool ke apne UI (CLI help, logs/summaries, dashboard) ke liye bhasha; sabse uchch-prathamikta wala source. Dekhen [Tool UI bhasha](/guide/tool-ui-language). |
| `-w` / `--write-logs [path]` | Chuni hui commands | Console output ko ek `.log` file mein tee karen (default path: root `cacheDir` ke neeche). Sirf `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, aur `cleanup` ke liye wired. |

<a id="per-command-help"></a>
### Pratyaek-command help

| Upyog | Vivaran |
|---|---|
| `ai-i18n-tools <command> --help` | Us command ke sabhi vikalp. |
| `ai-i18n-tools help <command>` | `<command> --help` ke samaan output. |

<a id="target-locales--l----locale"></a>
### Target locales (`-l` / `--locale`)

| Commands | Vyavahar |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — comma-separated target BCP-47 codes (jaise `de,fr,pt-BR`). Jab chhoda jata hai, to defaults config se aate hain (`json[]` blocks bhi per-block `targetLocales` set kar sakte hain; UI steps `targetLocales` minus `sourceLocale` ka upyog karte hain). |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — review karne ke liye ek source locale (default: config `sourceLocale`).                                                            |
