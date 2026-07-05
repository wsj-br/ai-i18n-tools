<a id="documentation-cache"></a>
# Documentation cache

The **Documentation** tab lists cached documentation segment translations stored in SQLite under your configured `cacheDir`. Each row is one source segment (identified by filepath, line hint, and source hash) translated to one target locale.

Use this tab when you want to **review, override, or clean up** cached doc translations without re-running the full pipeline.

<a id="filters"></a>
## Filters

| Filter | Purpose |
| --- | --- |
| **Select filepath** / **Filename (partial)** | Narrow to one file or a path substring |
| **All locales** | Target locale |
| **All models** | Model that produced the translation |
| **Source hash** | Exact segment hash |
| **Source text search** / **Translated text search** | Substring match |
| **All entries** | **Stale** (never reused since creation) or **Active** (has a `last_hit_at` timestamp) |

Click **Apply** after changing filters. **Clear** resets all filter fields.

<a id="edit-a-translation"></a>
## Edit a translation

1. Click the edit icon on a row.
2. Change the translated text in the modal and save.

The cache stores model `user-edited` for that row. Run `sync --force-update` or `translate-docs --force-update` so on-disk markdown outputs match the cache.

If **source text** in your repo changes later, the segment hash changes and manual edits for the old text are superseded on the next translation run.

<a id="delete-rows"></a>
## Delete rows

- **Row delete icon** — removes one cache entry (one locale for one source hash).
- **Delete filtered** — removes all rows matching the current filters (confirmation required).
- **Delete all for filepath** — removes every cached translation for the selected filepath, including related failure and markdown issue rows for that file.

After bulk deletes, run `translate-docs` or `sync` to regenerate missing translations.

<a id="table-columns"></a>
## Table columns

| Column | Meaning |
| --- | --- |
| **Filepath** | Cache key for the source file |
| **Line #** | Line hint in the source file |
| **Source hash** | Hash of the source segment text |
| **Source text** | Original segment (source locale) |
| **Locale** | Target locale |
| **Translated text** | Cached translation |
| **Model** | Model that produced the translation (or `user-edited`) |
| **Created** | When the row was first written |
| **Last hit** | Last time this cache entry was reused (red dash = stale) |

Pagination defaults to 50 rows per page (25 or 100 also available).

<a id="log-links"></a>
## Log links

The 🔗 control in a row asks the server to print file:line hints to the terminal where the dashboard is running. Use it to open the correct source location in your editor.
