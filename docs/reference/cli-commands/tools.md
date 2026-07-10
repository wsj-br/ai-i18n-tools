<a id="cli--tools"></a>
# CLI — Tools

<a id="dashboard"></a>
### `dashboard`

**Synopsis:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Launch the Translation Dashboard (local web UI for cache segments, `strings.json`, glossary, failures, and statistics). Default port **8675** (retries next port if unavailable). With `--no-open`, the default browser is not opened automatically. The deprecated alias `editor` still works but prints a warning.

**Key options:** `-p` / `--port`, `--no-open`

**See also:** [Translation Dashboard](/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Synopsis:** `ai-i18n-tools glossary-generate [-o <path>]`

Write an empty `glossary-user.csv` template. Refuses to overwrite an existing file (exit **1**).

**Key options:** `-o` / `--output`

`-o`: override the output path (default: `glossary.userGlossary` from config, or `glossary-user.csv`).

**See also:** [Dashboard glossary](/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**Synopsis:** `ai-i18n-tools help [command]`

Display help for a subcommand (same output as `ai-i18n-tools <command> --help`).
