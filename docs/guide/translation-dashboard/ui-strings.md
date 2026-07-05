<a id="ui-strings--plurals"></a>
# UI strings & plurals

The **UI strings** and **UI plurals** tabs edit rows in your `strings.json` catalog. Dashboard changes write directly to that file — not to the SQLite documentation cache.

Use these tabs when a UI label or plural form needs a manual fix after `translate-ui` or `sync`.

<a id="ui-strings-tab"></a>
## UI strings tab

Lists non-plural entries from `strings.json` — one row per string id and locale.

<a id="filters"></a>
### Filters

| Filter | Purpose |
| --- | --- |
| **Id / hash** | String id or hash |
| **Filename (partial)** / **Select filepath** | Source file scope |
| **Source contains** / **Translated contains** | Text substring |
| **Locale** | Single locale or all |
| **Model** | Model that produced the translation |

<a id="edit"></a>
### Edit

1. Click the edit icon on a row.
2. Change the translated text and save.

The entry's `models[locale]` is set to `user-edited`. Run plain `sync` or `translate-ui` to refresh flat locale files (`de.json`, etc.). Do **not** use `--force` — it re-translates every entry and can overwrite manual fixes.

When `glossary.autoAddUserEditedToGlossary` is `true` (default), the next `translate-ui` or `sync` can append your edit to the user glossary CSV automatically — see [Configuration](/reference/configuration#glossary).

<a id="delete"></a>
### Delete

- **Row delete icon** — removes one locale bucket from an entry.
- **Delete filtered** — bulk delete all locale buckets matching current filters.

<a id="log-links"></a>
### Log links

The 🔗 control prints source file:line locations from the entry's `locations` array to the terminal.

<a id="ui-plurals-tab"></a>
## UI plurals tab

Lists plural-group entries (`"plural": true` in `strings.json`). Each row shows one locale's cardinal forms (`one`, `other`, and locale-specific forms).

<a id="filters-1"></a>
### Filters

Same as the UI strings tab, plus:

| Filter | Purpose |
| --- | --- |
| **Complete / Incomplete** | Whether all required CLDR forms are present for the selected locale |

Incomplete rows are missing one or more required forms for that locale.

<a id="edit-1"></a>
### Edit

1. Click the edit icon on a row.
2. Edit each CLDR form in the modal (one textarea per form).
3. Save — empty form strings are removed on save.

The entry's `models[locale]` is set to `user-edited`. Run plain `sync` or `translate-ui` afterward (not `--force`).

<a id="other-columns"></a>
### Other columns

- **Forms** — displays `one: "…"`, `other: "…"`, etc.
- **`zeroDigit` badge** — read-only indicator when the source uses a digit-zero plural pattern.

Required forms come from CLDR rules per locale (`requiredPluralFormsByLocale`).

<a id="delete-1"></a>
### Delete

Same as UI strings: per-locale delete or **Delete filtered** bulk action.
