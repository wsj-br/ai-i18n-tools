<a id="cli--tools"></a>
# CLI — Tools

<a id="dashboard"></a>
### `dashboard`

**Synopsis:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Translation Dashboard (cache segments, `strings.json`, glossary, failures, aur statistics ke liye local web UI) launch karein. Default port **8675** (agar anupalabdh ho toh agla port retry karta hai). `--no-open` ke saath, default browser apne aap nahi khulta hai. Deprecated alias `editor` abhi bhi kaam karta hai lekin ek warning print karta hai.

**Key options:** `-p` / `--port`, `--no-open`

**Yeh bhi dekhein:** [Translation Dashboard](/hi-Latn/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Synopsis:** `ai-i18n-tools glossary-generate [-o <path>]`

Ek khaali `glossary-user.csv` template likhein. Existing file ko overwrite karne se mana karta hai (exit **1**).

**Key options:** `-o` / `--output`

`-o`: output path ko override karein (default: config se `glossary.userGlossary`, ya `glossary-user.csv`).

**Yeh bhi dekhein:** [Dashboard glossary](/hi-Latn/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**Synopsis:** `ai-i18n-tools help [command]`

Ek subcommand ke liye help display karein (`ai-i18n-tools <command> --help` jaisa hi output).
