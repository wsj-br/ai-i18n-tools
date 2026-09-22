<a id="glossary"></a>
# Glossary

The **Glossary** tab edits your user glossary CSV (`glossary.userGlossary` in config). Entries here are terminology hints for `translate-ui`, `proofread-ui`, and `translate-docs` (via the shared glossary). Compact UI-label abbreviations (for example `Size` → `Tam` / `Tam.`) are kept for UI translation but skipped when building document prompts, so they do not push models toward invented <code v-pre>{{…}}</code> tokens in markdown/MDX.

The tab is hidden when `glossary.userGlossary` is not configured.

<a id="csv-columns"></a>
## CSV columns

| Column | Meaning |
| --- | --- |
| **Original language string** | Source term or phrase |
| **locale** | Target locale, or `*` for all locales |
| **Translation** | Preferred translation |
| **Context** | Optional source-language explanation of intended meaning or usage. Sent only when this term matches the current batch. |
| **Force** | When checked, the term must be translated exactly as given |

<a id="add-a-row"></a>
## Add a row

Use the form at the top of the tab:

1. Enter **Original**, **locale** (`*` or a target locale code), and **Translation**.
2. Optionally add **Context** (usage notes) and check **Force**.
3. Click **Add**.

The CSV file is created on first add if it does not exist yet.

<a id="edit-or-delete"></a>
## Edit or delete

- **Inline edit** — change fields directly in the table and click **Save** on that row.
- **Delete** — remove a row with the delete control.

Changes take effect on the next `translate-ui`, `proofread-ui`, `translate-docs`, or `sync` run. Editing a **Context** note (or `glossary.contextFiles` in config) automatically refreshes cached translations for the affected locale — you do not need `--force`.

Keep context files as concise Markdown or plain-text briefs outside translated `docs[]` trees. The text is sent to the LLM on every matching request; do not include secrets or personal data. How those files and the CSV are built is covered in [Glossary](/guide/glossary).

<a id="filters"></a>
## Filters

Filter by **original text**, **locale** (including `*`), **translation text**, or **Context** substring, then click **Apply**.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Dashboard edits and glossary auto-add

When you fix a UI string in the **UI strings** or **UI plurals** tab, the next `translate-ui` run can append that correction to the glossary automatically if `glossary.autoAddUserEditedToGlossary` is `true`. Use the Glossary tab to review, adjust, or remove those auto-added rows.
