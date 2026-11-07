<a id="cli--getting-started"></a>
# CLI — Getting started

<a id="version"></a>
### `version`

**Synopsis:** `ai-i18n-tools version`

Print CLI version and build timestamp (same information as `-V` / `--version` on the root program).

---

<a id="init"></a>
### `init`

**Synopsis:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Write a starter config file (includes `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, and `docs[].addFrontmatter`). Translation commands that call an LLM require the active provider's API key in the environment or `.env` (Ollama excepted) — see [Provider and API key](/guide/quick-start#provider-and-api-key).

**Key options:** `-P` / `--provider` (required), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` is required. It selects which **built-in preset** to scaffold. Must be one of: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apikeyfan`, `cheaperinference`, `ollama`.

**Templates (`-t`):**

| Value | Scaffolds |
|-------|-----------|
| `ui-markdown` | UI strings plus README (flat output, language list) |
| `ui-docusaurus` | Docusaurus UI + docs |
| `ui-starlight` | Starlight docs |
| `ui-vitepress` | VitePress docs (`docsOutput.style: "vitepress"`) plus `vitepressThemeCatalog` for theme strings |
| `ui-nextra` | Nextra docs (`docsOutput.style: "nextra"`) plus `nextraDictionaryPath` for the theme dictionary (sidebar `_meta.ts` is collected automatically) |
| `ui-fumadocs` | Fumadocs docs (`docsOutput.style: "fumadocs"`) plus `fumadocsUiCatalog` for UI overrides (sidebar `meta.json` is collected automatically) |
| `ui-astro-website` | Astro website UI strings |
| `ui-plain-html` | Plain HTML catalog (`data-i18n*` markers, flat locale JSON) |
| `docs-plain-html` | Plain HTML documents (one file per locale, language list, hreflang) |
| `docs-markdown` | Markdown docs: README and `.md` files, flat output, language list |
| `ui-json-bundles` | JSON (`json[]` only) |
| `ui-python` | Python UI strings, flat JSON keyed by the source-language string, and `i18n.py` |
| `ui-python-gettext` | Python UI strings with flat JSON and GNU `.po` / `.mo`, plus `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` catalogs (`flatOutput: false`, domain `django`, no `i18n.py`) |
| `ui-python-flask` | Flask / Jinja catalogs under `translations/` (`flatOutput: false`) plus `i18n.py` |
| `ui-dotnet` | .NET UI strings, flat JSON keyed by the source-language string, and `I18n.cs` |
| `ui-dotnet-resx` | .NET UI strings as `.resx` satellites (`flatOutput: false`) and `I18nResx.cs` |

`--with-readme` appends a `README.md` docs block (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, a `languageListBlock`) and sets `features.translateDocs` to true. It does nothing when a docs block already lists `README.md`, which is the case for `ui-markdown` and `docs-markdown`. It writes the config only. It prints the marker line to paste into `README.md` and warns when that file is missing. Guide: [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` creates a starter `.translate-ignore` (including Python virtualenv and cache directories).

`init` also creates `.gitignore` in the working directory, or appends to it. The added lines are `.translation-cache/*`, `!.translation-cache/cache.db`, `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, and `*.backup.*`, each under a short comment. Lines already present are left as they are, and a second run does not duplicate them.

`ui-python`, `ui-python-gettext`, and `ui-python-flask` also write `i18n.py` when that file is missing. Django projects keep Django's own gettext runtime, so `ui-python-django` does not write `i18n.py`. `ui-dotnet` writes `I18n.cs` when that file is missing and prints the `EmbeddedResource` item to add to the `.csproj`. `ui-dotnet-resx` writes `I18nResx.cs` instead and points `ui.resx` at `Resources/SharedResource.<culture>.resx`. `--namespace` overrides the C# namespace. Guide: [.NET applications](/guide/ui-strings/dotnet) and [Add i18n to a .NET ResourceManager app](/guide/add-i18n-to-dotnet-resourcemanager).

`migrate-python-i18n` rewrites unsafe pre-evaluated calls (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) into lookup-before-format calls. The default is a dry run. Pass `--write` to edit files, and read `migrate-python-i18n-report.md` for review notes. A complex expression is named from the expression when that is stable (`start.isoformat()` becomes `{start}`, `len(rows)` becomes `{rows_count}`). A leftover `{value_1}` is reported so it can be renamed. Generated `i18n.py` files are skipped. A clean report does not mean unwrapped f-strings were covered.

`migrate-dotnet-i18n` does the same for `T($"...")`, concatenation, and `string.Format` inside `T()`. `--wrap` also marks unmarked XAML labels and high-confidence C# sinks; without `--write` that is an audit. The report is `migrate-dotnet-i18n-report.md`. Generated `I18n.cs` and `I18nResx.cs` are skipped. Guide: [.NET applications](/guide/ui-strings/dotnet#rewrite-unsafe-calls).

---

<a id="doctor"></a>
### `doctor`

**Synopsis:** `ai-i18n-tools doctor [--local] [--strict] [--json] [--fix-gitignore]`

Check that the project is ready to translate. The report covers config syntax and schema, business rules, the installed version, source and output paths, UI catalog files, placeholder mismatches in those catalogs, cache statistics, configured providers, supported environment variables that are set, and model ids. A catalog with a renamed, dropped, or rewritten placeholder is a warning and names one example.

By default, `doctor` also checks configured model ids against the active provider's catalog and compares the installed version with the latest GitHub release. `--local` skips both network calls. A newer release, or a GitHub request that fails, is a warning. A missing or expired model id fails the command. `--strict` exits with an error when any check warns.

API key values are never printed. Set variables are listed in alphabetical order as `Configured variables: NAME, ...`. A variable that is not an API key includes its value.

Missing input paths fail. Missing output directories are a note, because the first translation run creates them. `doctor` does not rewrite config, create directories, or send source text to a model. `--fix-gitignore` appends missing `.gitignore` lines and leaves every other file alone.

`doctor` warns when `.gitignore` next to the config is missing a required pattern. The warning tells you to run `ai-i18n-tools doctor --fix-gitignore`. When `.gitignore` already exists, that appends a blank line, the comment `# ai-i18n-tools doctor fix`, and only the missing lines. It does not duplicate lines already present. A missing file is created with the same block `init` writes. The two cache patterns follow the configured `cacheDir`, so `.i18n-cache` needs `.i18n-cache/*` and `!.i18n-cache/cache.db` rather than the default `.translation-cache` lines. The other patterns are `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, and `*.backup.*`. A line that ignores the cache directory itself, such as `.i18n-cache/`, is also a warning, because Git will not track `cache.db` under an ignored directory. `--fix-gitignore` does not remove that line. The warning fails the command only with `--strict`.

**Key options:** `--local`, `--strict`, `--json`, `--fix-gitignore`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
ai-i18n-tools doctor --fix-gitignore
```

---

<a id="help"></a>
### `help`

**Synopsis:** `ai-i18n-tools help [command]`

Display help for a subcommand (same output as `ai-i18n-tools <command> --help`).
