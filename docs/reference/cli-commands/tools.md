<a id="cli--dashboard--glossary"></a>
# CLI — Dashboard & glossary

<a id="dashboard"></a>
### `dashboard`

**Synopsis:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Launch the Translation Dashboard (local web UI for cache segments, `strings.json`, glossary, failures, statistics, and usage). Default port **8675** (retries next port if unavailable). With `--no-open`, the default browser is not opened automatically. `dash` is an equivalent alias. The deprecated alias `editor` still works but prints a warning.

**Key options:** `-p` / `--port`, `--no-open`

**See also:** [Translation Dashboard](/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Synopsis:** `ai-i18n-tools glossary-generate [-o <path>]`

Write an empty `glossary-user.csv` template. Refuses to overwrite an existing file (exit **1**).

**Key options:** `-o` / `--output`

`-o`: override the output path (default: `glossary.userGlossary` from config, or `glossary-user.csv`).

**See also:** [Glossary](/guide/glossary), [Dashboard glossary](/guide/translation-dashboard/glossary)
