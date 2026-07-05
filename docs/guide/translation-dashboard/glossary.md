<a id="glossary"></a>
# Glossary

The **Glossary** tab edits your user glossary CSV (`glossary.userGlossary` in config). Entries here are terminology hints for `translate-ui` and `proofread-ui` — they are **not** used by documentation translation.

The tab is hidden when `glossary.userGlossary` is not configured.

<a id="csv-columns"></a>
## CSV columns

| Column | Meaning |
| --- | --- |
| **Original language string** | Source term or phrase |
| **locale** | Target locale, or `*` for all locales |
| **Translation** | Preferred translation |
| **Force** | When checked, the term must be translated exactly as given |

<a id="add-a-row"></a>
## Add a row

Use the form at the top of the tab:

1. Enter **Original**, **locale** (`*` or a target locale code), and **Translation**.
2. Optionally check **Force**.
3. Click **Add**.

The CSV file is created on first add if it does not exist yet.

<a id="edit-or-delete"></a>
## Edit or delete

- **Inline edit** — change fields directly in the table and click **Save** on that row.
- **Delete** — remove a row with the delete control.

Changes take effect on the next `translate-ui`, `proofread-ui`, or `sync` UI step.

<a id="filters"></a>
## Filters

Filter by **original text**, **locale** (including `*`), or **translation text** substring, then click **Apply**.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Dashboard edits and glossary auto-add

When you fix a UI string in the **UI strings** or **UI plurals** tab, the next `translate-ui` run can append that correction to the glossary automatically if `glossary.autoAddUserEditedToGlossary` is `true`. Use the Glossary tab to review, adjust, or remove those auto-added rows.
