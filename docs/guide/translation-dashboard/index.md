<a id="translation-dashboard"></a>
# Translation Dashboard

The Translation Dashboard is a local web UI for inspecting and editing your project's translation data. It reads from three stores:

- **SQLite cache** (`cacheDir`) — documentation segment translations, failure records, markdown issue scans
- **`strings.json`** — UI string catalog (plain strings and plural groups)
- **User glossary CSV** (`glossary.userGlossary`) — terminology hints for `translate-ui` and `proofread-ui`

Use it after a translation run to find problems, override bad output, or review cache coverage — without digging through SQLite or JSON by hand.

<a id="start-the-dashboard"></a>
## Start the dashboard

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

The default listen port is **8675**. If that port is unavailable, the server tries the next port (up to 1000 attempts) and logs the port it chose. The deprecated alias `editor` still works but prints a warning — prefer `dashboard`.

The dashboard UI uses the same locale resolution as the CLI: `-L` / `--ui-lang` → `AI_I18N_LANG` → config `uiLanguage` → OS locale. See [Tool UI language](/guide/tool-ui-language).

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## Which tab should I use?

| I want to… | Tab | Guide |
| --- | --- | --- |
| Fix doc segments that failed translation | **Failures** | [Failures](/guide/translation-dashboard/failures) |
| Fix source markdown before translating | **Markdown issues** | [Markdown issues](/guide/translation-dashboard/markdown-issues) |
| Override a cached doc translation | **Documentation** | [Documentation cache](/guide/translation-dashboard/documentation-cache) |
| Fix a UI label | **UI strings** | [UI strings & plurals](/guide/translation-dashboard/ui-strings) |
| Fix a plural form (`one`, `other`, …) | **UI plurals** | [UI strings & plurals](/guide/translation-dashboard/ui-strings) |
| Lock terminology for UI translation | **Glossary** | [Glossary](/guide/translation-dashboard/glossary) |
| See cache coverage and model usage | **Statistics** | [Statistics](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## After you edit

| You edited… | Then run… | Avoid… |
| --- | --- | --- |
| Documentation cache row | `sync --force-update` or `translate-docs --force-update` | — |
| UI string or plural | plain `sync` or `translate-ui` | `--force` (overwrites `user-edited` rows) |
| Glossary row | next `translate-ui` or `proofread-ui` | — |

**Documentation (SQLite cache)** — Manual edits are tagged with model `user-edited` in the cache. Re-running `translate-docs` or `sync` on unchanged source reuses the cached translation (no LLM call). Run `sync --force-update` or `translate-docs --force-update` to refresh on-disk markdown from cache. Use `--force` only if you want to bypass cache and re-translate from the LLM (overwriting manual fixes).

**UI strings (`strings.json`)** — Manual edits are tagged with `user-edited` in `models[locale]`. Re-running `translate-ui` or `sync` skips entries that already have a translation. Use `--force` on UI commands to re-translate and overwrite manual fixes.

<a id="tips"></a>
## Tips

- **Log-link buttons** (🔗 in table rows) print file:line hints to the **terminal** where `ai-i18n-tools dashboard` is running — useful for jumping from the browser to your editor. If you are using VS Code derived IDE (like Cursor, Antigravity, ...), you can `CTRL`-click the file:line link in the Terminal window to open the file at the indicated line.
- **Close** (top-right of the tab bar) shuts down the dashboard server gracefully.
- If the server stops while the browser tab is still open, an overlay appears. Restart `ai-i18n-tools dashboard` to reconnect, or close the window if you are done with the dashboard.
