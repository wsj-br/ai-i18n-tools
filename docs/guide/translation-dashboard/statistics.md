<a id="statistics"></a>
# Statistics

The **Statistics** tab shows read-only aggregates for your documentation cache and UI string catalog. The data matches `ai-i18n-tools statistics` on the command line.

Use it to answer: *how much is translated, which models were used, and where are the gaps?*

<a id="documentation-cache"></a>
## Documentation cache

**Summary cards:**

| Card | Meaning |
| --- | --- |
| Total segments | All cached doc segment rows |
| Stale / Active | Segments never reused since creation vs reused at least once |
| Tracked files / Unique filepaths | File counts in the cache |
| Models used | Distinct translation models |
| Glossary entries | Row count in user glossary CSV (when configured) |

**Tables:**

- **Segments by locale** — count per target locale, with stale/active breakdown
- **Segments by model** — count per model
- **Model × locale matrix** — full cross-tab (same as CLI `--max-columns` limit on terminal output)

<a id="ui-strings"></a>
## UI strings

Shown when `strings.json` is available:

| Section | Meaning |
| --- | --- |
| Plain vs plural counts | Total non-plural and plural-group entries |
| Plain coverage per locale | How many plain strings have a translation per locale |
| Plural completeness per locale | How many plural groups have all required CLDR forms |
| By model / model × locale | Same matrix layout as documentation cache |

<a id="no-editing-on-this-tab"></a>
## No editing on this tab

Statistics is view-only. To change data, use the other dashboard tabs or re-run translation commands, then reload the dashboard.

For scripted output, run:

```bash
ai-i18n-tools statistics
# Optional: widen model × locale tables
# ai-i18n-tools statistics --max-columns 12
```
